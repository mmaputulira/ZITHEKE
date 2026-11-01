import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
const { EJSON } = mongoose.mongo.BSON;
import User from "../models/User.js";
import Ad from "../models/Ad.js";
import Offer from "../models/Offer.js";
import Order from "../models/Order.js";

// Explicit migration only. Never invoked automatically by server startup.
const apply = process.argv.includes("--apply");
const rollbackIndex = process.argv.indexOf("--rollback");
const changedFields = {
  users:["accountType","merchantStatus","merchantVerified"],
  offers:["isOpen","agreedAmount"], orders:["openKey"], ads:["reservedOrderId"],
};
const models = {users:User,offers:Offer,orders:Order,ads:Ad};
const report = {mode:apply?"apply":"dry-run",preservedLegacyAccountType:"merchant",warnings:[]};
try {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required. Use a backed-up database and run dry-run first.");
  await mongoose.connect(process.env.MONGO_URI,{autoIndex:false});
  if(rollbackIndex>=0) {
    if(!apply)throw new Error("Rollback requires --apply --rollback <snapshot file>.");
    const snapshot=EJSON.parse(await fs.readFile(process.argv[rollbackIndex+1],"utf8"));
    // Run rollback only before reopening traffic; otherwise newer role/order changes could be overwritten.
    for(const [name,rows] of Object.entries(snapshot.collections)) for(const row of rows) {
      const $set={},$unset={};for(const field of changedFields[name]){if(Object.hasOwn(row,field))$set[field]=row[field];else $unset[field]="";}
      const update={};if(Object.keys($set).length)update.$set=$set;if(Object.keys($unset).length)update.$unset=$unset;
      await models[name].collection.updateOne({_id:row._id},update);
    }
    console.log("Snapshot fields restored. Keep traffic closed until deployment verification completes.");
  } else {
    const duplicateOffers=await Offer.aggregate([{$match:{status:{$in:["PENDING","COUNTERED"]}}},{$group:{_id:{adId:"$adId",buyerUid:"$buyerUid"},count:{$sum:1}}},{$match:{count:{$gt:1}}}]);
    const duplicateOrders=await Order.aggregate([{$match:{status:{$in:["PENDING_SELLER","ACCEPTED"]}}},{$group:{_id:{adId:"$adId",buyerUid:"$buyerUid"},count:{$sum:1}}},{$match:{count:{$gt:1}}}]);
    const duplicateAccepted=await Order.aggregate([{$match:{status:"ACCEPTED"}},{$group:{_id:"$adId",count:{$sum:1}}},{$match:{count:{$gt:1}}}]);
    Object.assign(report,{legacyAccounts:await User.countDocuments({accountType:{$exists:false}}),buyerAccounts:await User.countDocuments({accountType:"buyer"}),offers:await Offer.countDocuments(),orders:await Order.countDocuments(),duplicateOffers,duplicateOrders,duplicateAccepted});
    if(duplicateOffers.length||duplicateOrders.length||duplicateAccepted.length)report.warnings.push("Resolve duplicate open offers/orders or multiple accepted orders before applying. No records will be discarded automatically.");
    if(apply) {
      if(report.warnings.length)throw new Error(JSON.stringify(report,null,2));
      const directory=path.resolve("backups");await fs.mkdir(directory,{recursive:true});
      const snapshot={createdAt:new Date(),collections:{}};
      for(const [name,model] of Object.entries(models)) snapshot.collections[name]=await model.collection.find({}, {projection:Object.fromEntries(changedFields[name].map(k=>[k,1]))}).toArray();
      report.snapshot=path.join(directory,`marketplace-migration-${Date.now()}.json`);
      await fs.writeFile(report.snapshot,EJSON.stringify(snapshot,null,2));
      await User.collection.updateMany({accountType:{$exists:false}},{$set:{accountType:"merchant"}});
      await User.collection.updateMany({merchantStatus:{$exists:false}},{$set:{merchantStatus:"active"}});
      // Legacy verified does not certify merchant review. Keep legacy field/history unchanged.
      await User.collection.updateMany({merchantVerified:{$exists:false}},{$set:{merchantVerified:false}});
      await Offer.collection.updateMany({},[{$set:{isOpen:{$in:["$status",["PENDING","COUNTERED"]]},agreedAmount:{$cond:[{$eq:["$status","ACCEPTED"]},{$ifNull:["$agreedAmount","$amount"]},null]}}}]);
      await Order.collection.updateMany({status:{$in:["PENDING_SELLER","ACCEPTED"]}},[{$set:{openKey:{$concat:[{$toString:"$adId"},":","$buyerUid"]}}}]);
      await Order.collection.updateMany({status:{$nin:["PENDING_SELLER","ACCEPTED"]}},{$unset:{openKey:""}});
      for(const order of await Order.find({status:"ACCEPTED"}).lean()) await Ad.collection.updateOne({_id:order.adId},{$set:{reservedOrderId:order._id}});
      for(const model of [User,Offer,Order,Ad])await model.createIndexes();
    }
    console.log(JSON.stringify(report,null,2));
  }
} catch(error) { console.error(error.message);process.exitCode=1; }
finally { await mongoose.disconnect(); }
