import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Admin from "../models/Admin.js";
import {adminRoles} from "../utils/adminAccess.js";
const roster=JSON.parse(await fs.readFile(new URL('../constants/zithekeStaff.json',import.meta.url),'utf8'));
const apply=process.argv.includes('--apply'),rollback=process.argv.indexOf('--rollback'),provision=process.argv.indexOf('--provision');
try{
 if(!process.env.MONGO_URI)throw new Error('MONGO_URI is required');
 await mongoose.connect(process.env.MONGO_URI,{autoIndex:false});
 if(rollback>=0){
  if(!apply)throw new Error('Rollback requires --apply');
  const snapshot=JSON.parse(await fs.readFile(process.argv[rollback+1],'utf8'));
  for(const item of snapshot){const update={$set:{role:item.role}};if(item.roles!==undefined)update.$set.roles=item.roles;else update.$unset={roles:''};await Admin.collection.updateOne({_id:new mongoose.Types.ObjectId(item._id)},update)}
  console.log(JSON.stringify({mode:'rollback',restored:snapshot.length}));
 }else if(provision>=0){
  if(!apply)throw new Error('Provisioning requires --apply --provision <email>');
  const email=String(process.argv[provision+1]||'').trim().toLowerCase();
  const staff=roster.find(item=>item.email===email);
  if(!staff)throw new Error('Use an email listed in the approved Zitheke staff roster.');
  if(!process.env.ZITHEKE_STAFF_PASSWORD||process.env.ZITHEKE_STAFF_PASSWORD.length<12)throw new Error('Provide a unique initial password of at least 12 characters through ZITHEKE_STAFF_PASSWORD, never a command-line argument.');
  if(await Admin.exists({email}))throw new Error('Account exists; use the roster assignment instead.');
  await Admin.create({...staff,role:staff.roles[0],password:await bcrypt.hash(process.env.ZITHEKE_STAFF_PASSWORD,12),mustChangePassword:true});
  console.log(JSON.stringify({mode:'provisioned',email,roles:staff.roles}));
 }else{
  const changes=[],missing=[],snapshot=[];
  for(const staff of roster){const existing=await Admin.findOne({email:staff.email}).lean();if(!existing){missing.push(staff.email);continue}changes.push({email:staff.email,previous:adminRoles(existing),assigned:staff.roles});snapshot.push({_id:String(existing._id),role:existing.role,...(existing.roles===undefined?{}:{roles:existing.roles})})}
  let backup;
  if(apply){await fs.mkdir('backups',{recursive:true});backup=path.join('backups',`staff-role-snapshot-${Date.now()}.json`);await fs.writeFile(backup,JSON.stringify(snapshot,null,2));for(const staff of roster)await Admin.collection.updateOne({email:staff.email},{$set:{roles:staff.roles,role:staff.roles[0]}})}
  const unassigned=await Admin.find({email:{$nin:roster.map(item=>item.email)}}).select('email role roles').lean();
  console.log(JSON.stringify({mode:apply?'apply':'dry-run',changes,missing,unassigned,backup},null,2));
 }
}catch(error){console.error(error.message);process.exitCode=1}finally{await mongoose.disconnect()}
