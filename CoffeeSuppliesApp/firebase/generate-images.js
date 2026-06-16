const fs=require("fs"),path=require("path"),https=require("https");
const KEY="tgp_v1_-TUhBFWehp6o0zOCoC6beDdPjWXGmupy7w8McR00J84";
const DIR=path.join(__dirname,"product-images");
const M="black-forest-labs/FLUX.1.1-pro";
const P=[
["single-wall-cup","A single white disposable paper coffee cup 12oz empty no lid no logo on a pure white background soft studio lighting subtle shadow product catalog photography centered sharp focus"],
["double-wall-cup","A single brown kraft double wall paper coffee cup 12oz empty no lid no logo textured outer layer on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["ripple-wall-cup","A single brown ripple wall corrugated paper coffee cup 12oz empty no lid no logo visible wavy ribbed texture on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["cold-cup-pet","A single clear transparent plastic disposable cup 16oz empty no lid no straw on a pure white background soft studio lighting minimal shadow product catalog photography centered"],
["espresso-cup","A single small white paper espresso cup 4oz size short and small empty no lid on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["hot-lid-sip","A single white plastic coffee cup sip lid top-down view showing the drink opening on a pure white background soft studio lighting product catalog photography centered"],
["cold-lid-flat","A single clear flat plastic cup lid with a round straw hole top-down view on a pure white background soft studio lighting product catalog photography centered"],
["cold-lid-dome","A single clear plastic dome lid for cold drinks side angle showing dome shape on a pure white background soft studio lighting product catalog photography centered"],
["paper-straw","Five kraft brown paper straws laid diagonally in a neat row on a pure white background soft studio lighting product catalog photography minimal shadow"],
["wrapped-straw","Three individually wrapped paper straws in white paper wrapping laid parallel on a pure white background soft studio lighting product catalog photography"],
["cup-sleeve-kraft","A single brown corrugated kraft paper coffee cup sleeve standing upright on a pure white background soft studio lighting product catalog photography centered"],
["cup-carrier-2","A brown molded pulp 2-cup drink carrier tray empty on a pure white background soft studio lighting product catalog photography slight angle from above"],
["cup-carrier-4","A brown molded pulp 4-cup drink carrier tray empty on a pure white background soft studio lighting product catalog photography slight angle from above"],
["beverage-napkin","A neat stack of white square beverage napkins about 20 stacked cleanly on a pure white background soft studio lighting product catalog photography centered"],
["sanitizer-wipes","A white cylindrical canister of surface sanitizer wipes with blue label on a pure white background soft studio lighting product catalog photography centered"],
["kraft-bag-small","A single small brown kraft paper bag with flat bottom standing upright no logo on a pure white background soft studio lighting product catalog photography centered"],
["kraft-bag-large","A single large brown kraft paper bag with twisted paper handles standing upright no logo on a pure white background soft studio lighting product catalog photography centered"],
["food-wrap","A roll of white grease-proof food wrapping paper partially unrolled on a pure white background soft studio lighting product catalog photography centered"],
["almarai-full-cream","A single 1-liter UHT milk carton white with blue accent stripe tall rectangular shape on a pure white background soft studio lighting product catalog photography centered"],
["nadec-full-cream","A single 1-liter UHT milk carton white with green accent stripe tall rectangular shape on a pure white background soft studio lighting product catalog photography centered"],
["almarai-whipping-cream","A single 1-liter whipping cream carton white with red accent tall rectangular dairy packaging on a pure white background soft studio lighting product catalog photography centered"],
["condensed-milk","A single can of sweetened condensed milk small tin can with pull-tab lid on a pure white background soft studio lighting product catalog photography centered"],
["evaporated-milk","A single small tin can of evaporated milk short cylindrical can on a pure white background soft studio lighting product catalog photography centered"],
["oat-milk-barista","A single 1-liter oat milk carton modern minimal design beige and brown tones on a pure white background soft studio lighting product catalog photography centered"],
["almond-milk-barista","A single 1-liter almond milk carton modern minimal design white and brown tones on a pure white background soft studio lighting product catalog photography centered"],
["coconut-milk","A single 1-liter coconut milk carton minimal design white and green tones on a pure white background soft studio lighting product catalog photography centered"],
["matcha-powder","A small round tin of bright green matcha powder with lid removed showing vivid green powder inside on a pure white background soft overhead studio lighting product catalog photography centered"],
["vanilla-syrup","A tall glass bottle of vanilla coffee syrup golden amber liquid black pump dispenser top on a pure white background soft studio lighting product catalog photography centered"],
["caramel-syrup","A tall glass bottle of caramel coffee syrup dark amber liquid black pump dispenser top on a pure white background soft studio lighting product catalog photography centered"],
["hazelnut-syrup","A tall glass bottle of hazelnut coffee syrup warm brown liquid black pump top on a pure white background soft studio lighting product catalog photography centered"],
["chocolate-sauce","A squeeze bottle of dark chocolate sauce brown plastic bottle with pointed tip cap on a pure white background soft studio lighting product catalog photography centered"],
["chai-concentrate","A glass bottle of spiced chai tea concentrate dark reddish-brown liquid on a pure white background soft studio lighting product catalog photography centered"],
["sugar-sticks-white","Five individually wrapped white sugar sticks in a neat row white paper wrapping on a pure white background soft studio lighting product catalog photography centered"],
["sugar-sticks-brown","Five individually wrapped brown sugar sticks in a neat row brown kraft paper wrapping on a pure white background soft studio lighting product catalog photography centered"],
["branded-cup","A white paper coffee cup with a simple minimal circular logo printed in brown ink custom branded on a pure white background soft studio lighting product catalog photography centered"],
["branded-sleeve","A brown kraft cup sleeve with a simple minimal logo printed in dark brown on a pure white background soft studio lighting product catalog photography centered"],
["branded-bag","A brown kraft paper bag with a simple minimal logo on the front on a pure white background soft studio lighting product catalog photography centered"],
["branded-stickers","A roll of circular stickers partially unrolled with simple minimal cafe logo on a pure white background soft studio lighting product catalog photography centered"],
];
function gen(id,prompt){return new Promise((ok,no)=>{const b=JSON.stringify({model:M,prompt,width:1024,height:1024,n:1});const r=https.request({hostname:"api.together.ai",path:"/v1/images/generations",method:"POST",headers:{"Authorization":"Bearer "+KEY,"Content-Type":"application/json","Content-Length":Buffer.byteLength(b)}},(res)=>{let d="";res.on("data",c=>d+=c);res.on("end",()=>{try{const j=JSON.parse(d);if(j.data&&j.data[0]&&j.data[0].url){https.get(j.data[0].url,(ir)=>{const ch=[];ir.on("data",c=>ch.push(c));ir.on("end",()=>{const buf=Buffer.concat(ch);fs.writeFileSync(path.join(DIR,id+".jpg"),buf);ok(buf.length);});}).on("error",no);}else{no(new Error(d.substring(0,150)));}}catch(e){no(e);}});});r.on("error",no);r.write(b);r.end();});}
async function run(){if(!fs.existsSync(DIR))fs.mkdirSync(DIR,{recursive:true});console.log("Generating "+P.length+" images...\n");for(let i=0;i<P.length;i++){const[id,pr]=P[i];const f=path.join(DIR,id+".jpg");if(fs.existsSync(f)&&fs.statSync(f).size>5000){console.log(`  [${i+1}/${P.length}] SKIP ${id}`);continue;}try{const sz=await gen(id,pr);console.log(`  [${i+1}/${P.length}] ok ${id} (${Math.round(sz/1024)}KB)`);}catch(e){console.log(`  [${i+1}/${P.length}] FAIL ${id}: ${e.message.substring(0,60)}`);}await new Promise(r=>setTimeout(r,1500));}console.log("\nDone! "+DIR);}
run();
