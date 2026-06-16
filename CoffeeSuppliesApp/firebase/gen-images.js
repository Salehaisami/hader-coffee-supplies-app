const fs=require("fs"),path=require("path");
const K="tgp_v1_-TUhBFWehp6o0zOCoC6beDdPjWXGmupy7w8McR00J84";
const D=path.join(__dirname,"product-images");
if(!fs.existsSync(D))fs.mkdirSync(D);
const P=[
["single-wall-cup","A single white disposable paper coffee cup 12oz empty no lid no logo on a pure white background soft studio lighting subtle shadow product catalog photography centered sharp focus"],
["double-wall-cup","A single brown kraft double wall paper coffee cup 12oz empty no lid no logo textured outer layer on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["ripple-wall-cup","A single brown ripple wall corrugated paper coffee cup 12oz empty no lid no logo visible wavy ribbed texture on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["cold-cup-pet","A single clear transparent plastic disposable cup 16oz empty no lid slightly tapered on a pure white background soft studio lighting minimal shadow product catalog photography centered"],
["espresso-cup","A single small white paper espresso cup 4oz size short and small empty no lid on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["hot-lid-sip","A single white plastic coffee cup sip lid top-down view showing the drink opening on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["cold-lid-flat","A single clear flat plastic cup lid with a round straw hole top-down view on a pure white background soft studio lighting product catalog photography centered"],
["cold-lid-dome","A single clear plastic dome lid for cold drinks side angle showing rounded dome shape on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["paper-straw","Five kraft brown paper straws laid diagonally in a neat row on a pure white background soft studio lighting product catalog photography minimal shadow sharp focus"],
["wrapped-straw","Three individually wrapped paper straws in white paper wrapping laid parallel at slight angle on a pure white background soft studio lighting product catalog photography"],
["cup-sleeve-kraft","A single brown corrugated kraft paper coffee cup sleeve standing upright not on a cup on a pure white background soft studio lighting visible corrugated texture product catalog photography centered"],
["cup-carrier-2","A brown molded pulp 2-cup drink carrier tray empty on a pure white background soft studio lighting subtle shadow product catalog photography slight angle from above"],
["cup-carrier-4","A brown molded pulp 4-cup drink carrier tray empty on a pure white background soft studio lighting subtle shadow product catalog photography slight angle from above"],
["beverage-napkin","A neat stack of white square beverage napkins about 20 stacked cleanly on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["sanitizer-wipes","A white cylindrical canister of surface sanitizer wipes with blue label on a pure white background soft studio lighting product catalog photography centered"],
["kraft-bag-small","A single small brown kraft paper bag with flat bottom standing upright no logo on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["kraft-bag-large","A single large brown kraft paper bag with twisted paper handles standing upright no logo on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["food-wrap","A roll of white grease-proof food wrapping paper partially unrolled on a pure white background soft studio lighting product catalog photography centered"],
["almarai-full-cream","A single 1 liter UHT milk carton white with blue accent stripe tall rectangular shape on a pure white background soft studio lighting product catalog photography centered"],
["nadec-full-cream","A single 1 liter UHT milk carton white with green accent stripe tall rectangular shape on a pure white background soft studio lighting product catalog photography centered"],
["almarai-whipping-cream","A single 1 liter whipping cream carton white with red accent tall rectangular dairy packaging on a pure white background soft studio lighting product catalog photography centered"],
["condensed-milk","A single can of sweetened condensed milk small tin can with pull-tab lid on a pure white background soft studio lighting subtle shadow product catalog photography centered"],
["evaporated-milk","A single small tin can of evaporated milk 170g size short cylindrical can on a pure white background soft studio lighting product catalog photography centered"],
["oat-milk-barista","A single 1 liter oat milk carton modern minimal design beige and brown tones on a pure white background soft studio lighting product catalog photography centered"],
["almond-milk-barista","A single 1 liter almond milk carton modern minimal design white and brown tones on a pure white background soft studio lighting product catalog photography centered"],
["coconut-milk","A single 1 liter coconut milk carton tropical minimal design white and green tones on a pure white background soft studio lighting product catalog photography centered"],
["matcha-powder","A small round tin of bright green matcha powder with lid removed showing vivid green powder inside on a pure white background soft overhead studio lighting product catalog photography centered"],
["vanilla-syrup","A tall glass bottle of vanilla coffee syrup golden amber liquid black pump dispenser top elegant simple label on a pure white background soft studio lighting product catalog photography centered"],
["caramel-syrup","A tall glass bottle of caramel coffee syrup dark amber liquid black pump dispenser top on a pure white background soft studio lighting product catalog photography centered"],
["hazelnut-syrup","A tall glass bottle of hazelnut coffee syrup warm brown liquid black pump dispenser top on a pure white background soft studio lighting product catalog photography centered"],
["chocolate-sauce","A squeeze bottle of dark chocolate sauce brown plastic bottle with pointed tip cap on a pure white background soft studio lighting product catalog photography centered"],
["chai-concentrate","A glass bottle of spiced chai tea concentrate dark reddish-brown liquid simple label on a pure white background soft studio lighting product catalog photography centered"],
["sugar-sticks-white","Five individually wrapped white sugar sticks in a neat row white paper wrapping on a pure white background soft studio lighting product catalog photography centered"],
["sugar-sticks-brown","Five individually wrapped brown sugar sticks in a neat row brown kraft paper wrapping on a pure white background soft studio lighting product catalog photography centered"],
["branded-cup","A white paper coffee cup with a simple minimal circular logo printed in brown ink custom branded on a pure white background soft studio lighting product catalog photography centered"],
["branded-sleeve","A brown kraft cup sleeve with a simple minimal logo printed in dark brown custom branded on a pure white background soft studio lighting product catalog photography centered"],
["branded-bag","A brown kraft paper bag with a simple minimal logo printed in dark brown on front on a pure white background soft studio lighting product catalog photography centered"],
["branded-stickers","A roll of circular stickers partially unrolled stickers have a simple minimal cafe logo on a pure white background soft studio lighting product catalog photography centered"],
];

async function gen(id,prompt){
  const r=await fetch("https://api.together.ai/v1/images/generations",{method:"POST",headers:{"Authorization":"Bearer "+K,"Content-Type":"application/json"},body:JSON.stringify({model:"black-forest-labs/FLUX.1.1-pro",prompt,width:1024,height:1024,n:1})});
  const j=await r.json();
  if(j.data&&j.data[0]){
    if(j.data[0].url){const ir=await fetch(j.data[0].url);fs.writeFileSync(path.join(D,id+".jpg"),Buffer.from(await ir.arrayBuffer()));}
    else if(j.data[0].b64_json){fs.writeFileSync(path.join(D,id+".jpg"),Buffer.from(j.data[0].b64_json,"base64"));}
    return true;
  }
  console.error("FAIL",id,JSON.stringify(j).slice(0,200));return false;
}

async function run(){
  console.log("Generating "+P.length+" images...\n");
  let ok=0;
  for(let i=0;i<P.length;i++){
    process.stdout.write(`  [${i+1}/${P.length}] ${P[i][0]}...`);
    try{if(await gen(P[i][0],P[i][1])){ok++;console.log(" done");}else console.log(" failed");}
    catch(e){console.log(" err: "+e.message);}
    if(i<P.length-1)await new Promise(r=>setTimeout(r,1500));
  }
  console.log("\n"+ok+"/"+P.length+" generated.");
}
run();
