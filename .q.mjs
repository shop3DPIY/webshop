import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
const env = Object.fromEntries(readFileSync(".env.local","utf8").split("\n").filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf("=");return [l.slice(0,i),l.slice(i+1).replace(/^"|"$/g,"")]}));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
if (process.argv[2] === "add") {
  console.log((await db.from("products").insert({ slug:"test-details-2", title:"TEST details 2", description:"t", category:"tech-electronics", license_type:"personal", publication_status:"published",
      dimensions:{width:120,depth:80,height:40},
      print_settings:{ scale:"1:6", plates:2, parts:5, supportsRequired:true, compatiblePrinters:["Bambu Lab A1"], requiredParts:[{qty:1,name:"ESP32"}] } })).error ?? "added");
} else if (process.argv[2]==="ids") { console.log((await db.from("products").select("id,slug,download_files").eq("slug","dolce-gusto-cup-holder")).data?.map(p=>[p.id,p.download_files.map(f=>f.format)])); }
else console.log((await db.from("products").delete().eq("slug","test-details-2")).error ?? "deleted");
