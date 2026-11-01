import 'dotenv/config';
import fs from 'node:fs/promises';
import dns from 'node:dns';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin.js';
const roster=JSON.parse(await fs.readFile(new URL('../constants/zithekeStaff.json',import.meta.url),'utf8'));
// Optional per-process DNS configuration; no machine-wide DNS changes.
if(process.env.ZITHEKE_DNS_SERVERS)dns.setServers(process.env.ZITHEKE_DNS_SERVERS.split(',').map(value=>value.trim()).filter(Boolean));
const apply=process.argv.includes('--apply');
try {
 if(!process.env.MONGO_URI)throw new Error('MONGO_URI is required');
 await mongoose.connect(process.env.MONGO_URI,{autoIndex:false});
 const existing=await Admin.find({email:{$in:roster.map(staff=>staff.email)}}).lean();
 const planned=roster.map(staff=>{const current=existing.find(item=>item.email===staff.email);return {...staff,action:!current?'create':current.passwordChangedAt?'preserve_personal_password':'set_temporary_password_and_require_change'}});
 if(!apply){console.log(JSON.stringify({mode:'dry-run',planned},null,2));}
 else {
  const password=process.env.ZITHEKE_STAFF_PASSWORD;
  if(!password||password.length<12||Buffer.byteLength(password,'utf8')>72)throw new Error('Provide a temporary password of at least 12 characters and no more than 72 UTF-8 bytes through ZITHEKE_STAFF_PASSWORD');
  await Admin.init();
  const session=await mongoose.startSession();
  try {
   await session.withTransaction(async()=>{
    for(const staff of roster){
     const current=await Admin.findOne({email:staff.email}).session(session);
     if(current?.passwordChangedAt)continue;
     const hash=await bcrypt.hash(password,12);
     if(current){
      // Conditional write also protects a password changed while this batch runs.
      await Admin.updateOne({_id:current._id,passwordChangedAt:null},{$set:{password:hash,roles:staff.roles,role:staff.roles[0],mustChangePassword:true},$inc:{tokenVersion:1}},{session});
     }else await Admin.create([{...staff,role:staff.roles[0],password:hash,mustChangePassword:true}],{session});
    }
   });
  }finally{await session.endSession()}
  console.log(JSON.stringify({mode:'provisioned',staff:planned},null,2));
 }
}catch(error){console.error(error.message);process.exitCode=1}finally{await mongoose.disconnect()}
