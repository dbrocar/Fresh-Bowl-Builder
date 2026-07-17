import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Share2, Lock, Users } from "lucide-react";

function Row({ label, val, note }: { label: string; val: string; note?: string }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-border/40 last:border-0 text-sm gap-2">
      <span className="text-muted-foreground">{label}{note && <span className="block text-[10px] text-muted-foreground/70">{note}</span>}</span>
      <span className="font-semibold text-foreground shrink-0">{val}</span>
    </div>
  );
}

export function GuidePage() {
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="pt-1">
        <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">FreshBowl Guide</h1>
        <p className="text-muted-foreground text-sm font-medium">Everything you need to know about whole-food feeding.</p>
      </div>

      {/* VIDEO */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="aspect-video bg-muted relative flex items-center justify-center">
          <iframe
            width="100%" height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Choosing Proteins for Your Dog"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0"
          />
        </div>
        <CardContent className="p-4 bg-card">
          <h3 className="font-bold font-serif text-lg mb-1">Choosing Your Dog's Proteins</h3>
          <p className="text-sm text-muted-foreground">Rotate through at least 3 proteins weekly to ensure a full amino acid profile and prevent sensitivities from developing.</p>
        </CardContent>
      </Card>

      {/* DAILY CONSTANTS */}
      <div>
        <h3 className="font-bold font-serif text-xl mb-1 px-1">Daily Constants</h3>
        <p className="text-sm text-muted-foreground px-1 mb-3">These go in <em>every</em> meal. They fill the nutrient gaps that fresh meat alone cannot cover.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "🐟", name: "Fish Oil", dose: "1,000 mg per 10 lb body weight", why: "Omega-3 EPA & DHA. Critical for brain, coat, joint, and heart health. Counter-balances the high omega-6 in most meats." },
            { icon: "🌿", name: "Kelp Powder", dose: "¼ tsp per 25 lbs body weight", why: "Natural iodine for thyroid function. Also provides trace minerals. Don't exceed — iodine toxicity is real." },
            { icon: "🥚", name: "Raw Egg", dose: "1 egg per 20 lbs (3–4×/week)", why: "Biotin, choline, B12, selenium, vitamin D. Shell is a calcium source. Blend the whole egg — including shell — for max benefit." },
            { icon: "🦪", name: "Green-Lipped Mussel", dose: "½ tsp per 25 lbs body weight", why: "Natural ETA fatty acids + glycosaminoglycans for joint cartilage. More bioavailable than most synthetic supplements." },
            { icon: "💛", name: "Turmeric / Golden Paste", dose: "¼ tsp per 25 lbs", why: "Curcumin is a potent anti-inflammatory. Must be combined with black pepper and a fat source for absorption." },
            { icon: "🌱", name: "Nutritional Yeast", dose: "1 tsp per 25 lbs", why: "B-vitamin complex (B1–B6, folic acid). Also provides trace minerals and improves palatability." },
          ].map(c => (
            <Card key={c.name} className="border-none shadow-sm">
              <CardContent className="p-3">
                <div className="text-2xl mb-1">{c.icon}</div>
                <div className="font-bold text-sm">{c.name}</div>
                <div className="text-[11px] font-medium text-primary mt-0.5">{c.dose}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.why}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* MAIN ACCORDION */}
      <div className="bg-card rounded-2xl shadow-sm overflow-hidden">
        <Accordion type="multiple" className="w-full">

          <AccordionItem value="sharing" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🐕 Dog Walker Access & Important Contacts
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4 text-sm">
              <div className="space-y-3">
                <div className="p-3 bg-muted rounded-xl">
                  <div className="font-bold flex items-center gap-2 mb-1"><Lock className="w-4 h-4 text-primary" /> How a dog walker logs in</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">Go to <strong>Utilities</strong> → <strong>Dog Walker Login</strong> and enter the PIN you created in <strong>Dog Profile → Share</strong>. The walker gets a limited view: today's schedule, the ability to mark meals, and the walk tracker. They cannot edit medical records, recipes, or the profile.</p>
                </div>
                <div className="p-3 bg-muted rounded-xl">
                  <div className="font-bold flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-primary" /> Setting up a walker</div>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                    <li>Open <strong>Dog Profile → Share</strong>.</li>
                    <li>Enter the walker's name and choose a 4+ digit PIN.</li>
                    <li>Turn on what they can do: log walks, mark feedings, view schedule.</li>
                    <li>Tap <strong>Create Access</strong> and share the PIN and app link with them.</li>
                  </ol>
                </div>
                <Button className="w-full" onClick={() => {
                  const url = typeof window !== "undefined" ? window.location.href : "";
                  if (navigator.share) navigator.share({ title: "FreshBowl", url }).catch(() => {});
                  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => alert("App link copied to clipboard"));
                }}><Share2 className="w-4 h-4 mr-2" /> Send App Link</Button>
                <div className="p-3 bg-muted rounded-xl">
                  <div className="font-bold flex items-center gap-2 mb-1"><Phone className="w-4 h-4 text-primary" /> Important contacts</div>
                  <p className="text-muted-foreground text-xs leading-relaxed">Save your vet, emergency clinic, groomer, trainer, and any other key contacts under <strong>Dog Profile → Care → Vet Information</strong>. Tap any saved phone number to call, or tap an address to open it in Maps. Add extra contacts under the vet card.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="aafco" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              📋 Complete AAFCO Nutrient Requirements
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <p className="text-xs text-muted-foreground">AAFCO 2016 adult dog minimums (per 1,000 kcal ME basis). Values in bold are critical to monitor in fresh-fed diets.</p>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Macronutrients</div>
                  <Row label="Crude Protein" val="45 g" note="Essential amino acids included" />
                  <Row label="Crude Fat" val="13.8 g" note="Minimum — fresh meat easily exceeds" />
                  <Row label="Linoleic Acid (Omega-6)" val="2.8 g" />
                  <Row label="α-Linolenic Acid (Omega-3)" val="0.11 g" note="Fish oil covers this" />
                  <Row label="EPA + DHA" val="0.13 g" note="Fish oil critical" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Minerals</div>
                  <Row label="Calcium" val="1.25 g" note="⚠️ Raw bone or supplement essential" />
                  <Row label="Phosphorus" val="1.0 g" note="Meat is rich — usually met" />
                  <Row label="Ca:P Ratio" val="1:1 to 2:1" note="Critical ratio — excess P without Ca causes bone loss" />
                  <Row label="Potassium" val="1.0 g" />
                  <Row label="Sodium" val="0.2 g" />
                  <Row label="Chloride" val="0.3 g" />
                  <Row label="Magnesium" val="0.15 g" />
                  <Row label="Iron" val="10 mg" note="Organ meats are excellent sources" />
                  <Row label="Copper" val="1.83 mg" note="⚠️ Liver is rich; limit to 5% of diet" />
                  <Row label="Manganese" val="0.31 mg" />
                  <Row label="Zinc" val="20 mg" note="Oysters, beef — supplement if feeding mostly chicken" />
                  <Row label="Iodine" val="0.25 mg" note="⚠️ Kelp powder covers this" />
                  <Row label="Selenium" val="0.028 mg" note="Brazil nut (1 per week) or seafood" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Fat-Soluble Vitamins</div>
                  <Row label="Vitamin A" val="1,250 IU" note="Liver is extremely rich — limit to 5% diet" />
                  <Row label="Vitamin D" val="125 IU" note="⚠️ Gap in fresh diets — egg yolk + fish help" />
                  <Row label="Vitamin E" val="12.5 IU" note="Oxidizes easily; add mixed tocopherols if feeding raw fat" />
                  <Row label="Vitamin K" val="0.025 mg" note="Leafy greens cover this" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">B Vitamins</div>
                  <Row label="Thiamine (B1)" val="0.56 mg" note="Destroyed by cooking; raw feeding covers this" />
                  <Row label="Riboflavin (B2)" val="1.3 mg" />
                  <Row label="Niacin (B3)" val="3.4 mg" />
                  <Row label="Pantothenic Acid (B5)" val="3.0 mg" />
                  <Row label="Pyridoxine (B6)" val="0.38 mg" />
                  <Row label="Biotin (B7)" val="0.028 mg" note="Raw egg whites reduce absorption; use whole egg" />
                  <Row label="Folic Acid (B9)" val="0.054 mg" note="Dark leafy greens" />
                  <Row label="Cobalamin (B12)" val="0.007 mg" note="Only in animal products — meat & organs cover this" />
                  <Row label="Choline" val="340 mg" note="Egg yolk and liver are excellent sources" />
                </div>
                <p className="text-[11px] text-muted-foreground border-t border-border pt-2">Source: AAFCO 2016 Dog Food Nutrient Profiles. Values are minimums; some nutrients have maximum safe levels — track copper and Vitamin A when feeding liver regularly.</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ratio" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🥣 The 70/10/10/10 Bowl Rule
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              <p className="text-muted-foreground">When building fresh bowls without a synthetic mineral premix, aim for this ratio by weight:</p>
              <div className="space-y-2">
                {[
                  { pct: "70%", name: "Muscle Meat", color: "bg-red-500", detail: "Chicken breast/thigh, ground beef, turkey, salmon, venison. Heart counts as muscle meat and is the richest source of CoQ10 and taurine." },
                  { pct: "10%", name: "Raw Meaty Bone", color: "bg-amber-500", detail: "Chicken necks/backs, duck necks, rabbit pieces. Provides calcium & phosphorus in a bioavailable ratio. If boneless, use bone meal or eggshell powder (~1 tsp per lb of food)." },
                  { pct: "10%", name: "Secreting Organ", color: "bg-orange-500", detail: "Liver (max 5%), plus kidney, spleen, brain, or pancreas. Organs are the multi-vitamin of the diet. Liver is rich in Vitamin A — don't exceed 5% total diet." },
                  { pct: "10%", name: "Plant Matter", color: "bg-green-500", detail: "Lightly steam or puree vegetables for better digestibility. Leafy greens, broccoli, zucchini, carrot. Add starch (sweet potato, quinoa) for active/working dogs." },
                ].map(r => (
                  <div key={r.pct} className="flex gap-3 p-3 bg-muted rounded-xl">
                    <div className={`w-14 h-14 rounded-xl ${r.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}>{r.pct}</div>
                    <div>
                      <div className="font-semibold">{r.name}</div>
                      <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{r.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 text-xs">
                <strong>FreshBowl Tip:</strong> FreshBowl builds your rotation using the 70/10/10/10 framework automatically. The 10% bone portion is assumed to be covered by your daily constants (eggshell powder, raw bone) or bone-in cuts selected as proteins.
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="feeding-pct" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              ⚖️ How Much to Feed by Body Weight
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              <p className="text-muted-foreground">Fresh food feeding is typically calculated as a percentage of ideal body weight per day. The Calories calculator gives the precise kcal number — this table is a quick starting point.</p>
              <div className="space-y-1">
                <Row label="Puppy (< 4 months)" val="8–10% of body weight/day" />
                <Row label="Puppy (4–12 months)" val="5–8% of body weight/day" />
                <Row label="Adult — Sedentary" val="2–2.5% of body weight/day" />
                <Row label="Adult — Moderate activity" val="2.5–3% of body weight/day" />
                <Row label="Adult — High activity / Working" val="3–4% of body weight/day" />
                <Row label="Senior (7+ years)" val="2–2.5% (monitor condition closely)" />
                <Row label="Pregnant / Lactating" val="Consult vet — needs 25–50% more" />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 text-xs">
                <strong>Example:</strong> A 25 kg moderately active adult dog = 25,000g × 2.5% = 625g food/day, split into two ~312g meals.
              </div>
              <p className="text-xs text-muted-foreground">Always adjust based on body condition score. If you can't feel the ribs easily, reduce by 10%. If ribs are too prominent, increase by 10%.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="proteins" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🥩 Protein Selection Guide
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              <p className="text-muted-foreground">Rotate through at least 3–4 proteins over the week. This prevents nutrient gaps and reduces the risk of developing food sensitivities.</p>
              <div className="space-y-2">
                {[
                  { name: "Chicken", emoji: "🐔", profile: "Lean, affordable, high protein. Best paired with fatty fish for omega-3 balance. Most dogs tolerate it well but some develop sensitivities with exclusive feeding." },
                  { name: "Turkey", emoji: "🦃", profile: "Lean, rich in tryptophan and B vitamins. Great for dogs prone to weight gain. Ground turkey thighs are more nutritious than breast." },
                  { name: "Beef", emoji: "🐄", profile: "High in zinc, iron, and B12. Fattier cuts provide CLA. Ground beef (80/20) is balanced and palatability is excellent." },
                  { name: "Salmon / Sardines", emoji: "🐟", profile: "Richest natural source of EPA & DHA omega-3. Sardines (packed in water) are also excellent calcium sources when eaten whole. Feed 2×/week." },
                  { name: "Duck", emoji: "🦆", profile: "Novel protein — great for dogs with chicken/beef sensitivities. Higher fat content, rich in iron. Very palatable." },
                  { name: "Lamb", emoji: "🐑", profile: "Novel protein, good zinc and B12 source. Higher in saturated fat — good for lean dogs. More expensive but rotation-worthy." },
                  { name: "Venison / Rabbit", emoji: "🦌", profile: "Excellent novel proteins for allergic dogs. Very lean — add fat source. Rabbit is nearly nutritionally complete and highly digestible." },
                ].map(p => (
                  <div key={p.name} className="p-3 bg-muted rounded-xl">
                    <div className="font-semibold">{p.emoji} {p.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.profile}</div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="organs" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🫀 Organ Meat — Nature's Multivitamin
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              <p className="text-muted-foreground">Organs must make up ~10% of the diet — 5% liver, 5% other secreting organs. They're the most nutrient-dense foods on earth.</p>
              <div className="space-y-2">
                {[
                  { name: "Liver (any species)", emoji: "🟤", note: "MAX 5% of total diet", profile: "Highest Vitamin A food source. Also rich in B12, copper, folate, and iron. Start slow — too much causes Vitamin A toxicity. Beef liver > chicken liver in nutrient density." },
                  { name: "Heart", emoji: "❤️", note: "Counts as muscle meat", profile: "Nature's CoQ10 source. Rich in taurine, B vitamins, and iron. Chicken hearts are small and easy to portion. Beef heart is very lean and economical." },
                  { name: "Kidney", emoji: "🫘", note: "Secreting organ", profile: "Rich in B12, riboflavin (B2), selenium, and iron. Both beef and pork kidney are excellent. More palatable than spleen for most dogs." },
                  { name: "Spleen", emoji: "🟣", note: "Secreting organ", profile: "Highest natural source of heme iron — ideal for anemic dogs. Also rich in zinc. Can be very soft — freeze briefly before cutting." },
                  { name: "Pancreas", emoji: "🩷", note: "Secreting organ — digestive enzymes", profile: "Natural source of digestive enzymes (lipase, amylase, protease). Beneficial for dogs with EPI (exocrine pancreatic insufficiency)." },
                  { name: "Brain", emoji: "🧠", note: "Secreting organ — rich fat", profile: "Extremely rich in DHA omega-3 and phospholipids. Excellent for puppies and senior dogs. Limit to 1–2× per week due to high fat." },
                ].map(o => (
                  <div key={o.name} className="p-3 rounded-xl bg-muted">
                    <div className="flex justify-between">
                      <div className="font-semibold">{o.emoji} {o.name}</div>
                      <div className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{o.note}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{o.profile}</div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="veggies" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🥦 Vegetables & Starches
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              <p className="text-muted-foreground">Dogs have a short digestive tract and can't fully break down raw plant cell walls. Lightly steam or puree vegetables for 60–80% better nutrient absorption.</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { name: "Collard Greens", emoji: "🥬", benefit: "Calcium, Vitamin K, folate" },
                  { name: "Broccoli", emoji: "🥦", benefit: "Sulforaphane, Vitamin C, K" },
                  { name: "Spinach / Kale", emoji: "🌿", benefit: "Iron, folate, Vitamin A" },
                  { name: "Zucchini", emoji: "🫛", benefit: "Low calorie, Vitamin B6, potassium" },
                  { name: "Pumpkin", emoji: "🎃", benefit: "Fiber for gut health, beta-carotene" },
                  { name: "Carrot", emoji: "🥕", benefit: "Beta-carotene, fiber, low cal" },
                  { name: "Sweet Potato", emoji: "🍠", benefit: "Complex carbs, Vitamin A, potassium" },
                  { name: "Brown Rice", emoji: "🍚", benefit: "Digestible energy, manganese, B vitamins" },
                  { name: "Quinoa", emoji: "🌾", benefit: "Complete protein, iron, magnesium" },
                  { name: "Oats (cooked)", emoji: "🥣", benefit: "Soluble fiber (beta-glucan), B vitamins" },
                ].map(v => (
                  <div key={v.name} className="p-2 bg-muted rounded-lg">
                    <div className="text-base">{v.emoji}</div>
                    <div className="font-semibold text-xs">{v.name}</div>
                    <div className="text-[10px] text-muted-foreground">{v.benefit}</div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 text-xs">
                <strong className="text-red-700 dark:text-red-300">⚠️ Avoid:</strong> Onion, garlic, leek (hemolytic anemia) · Grapes & raisins (kidney failure) · Avocado (persin toxicity) · Corn on the cob (obstruction) · Mushrooms (many varieties toxic)
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="transition" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🔄 Transitioning from Kibble
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
              <p>Abrupt switches cause digestive upset. The gut microbiome needs time to adapt to producing more digestive acids for raw protein.</p>
              <div className="space-y-2">
                {[
                  { week: "Week 1", tip: "Replace 25% of kibble with fresh food. Keep one protein only (chicken is easiest). Expect looser stools as microbiome shifts." },
                  { week: "Week 2", tip: "Move to 50% fresh / 50% kibble. Add a small amount of organ meat (5% of the fresh portion). Monitor stool consistency." },
                  { week: "Week 3", tip: "75% fresh. Introduce a second protein. Begin adding vegetables (lightly steamed). Stools should be firming up — smaller and less odorous." },
                  { week: "Week 4+", tip: "100% fresh. Add daily constants (fish oil, kelp, egg). Build out the full rotation. Track weight weekly for the first month." },
                ].map(w => (
                  <div key={w.week} className="p-3 bg-muted rounded-xl">
                    <div className="font-bold text-foreground">{w.week}</div>
                    <div className="text-xs mt-1">{w.tip}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs">💡 Tip: Do <strong className="text-foreground">not</strong> mix raw and kibble in the same bowl — they digest at different rates. Feed one or the other per meal.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="hydration" className="border-b border-border/50">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              💧 Hydration & Water Needs
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm text-muted-foreground">
              <p>Fresh food contains 65–80% moisture (vs kibble's 10%). Most fresh-fed dogs drink 30–50% less water from their bowl — this is normal and expected.</p>
              <Row label="Basic water requirement" val="50–70 ml per kg body weight/day" />
              <Row label="Fresh food moisture contribution" val="~300–450 ml per 500g of food" />
              <Row label="Active / hot weather increase" val="+20–30%" />
              <p className="text-xs">Always provide clean, fresh water ad libitum (free access). Never restrict water. If water consumption suddenly increases or decreases dramatically, consult your vet — it can indicate kidney disease, diabetes, or other conditions.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="toxic" className="border-none">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold hover:no-underline">
              🚫 Toxic Foods & Safety Rules
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3 text-sm">
              <div className="space-y-2">
                {[
                  { item: "Grapes, Raisins, Currants", risk: "EXTREME", detail: "Causes acute kidney failure. Even tiny amounts can be fatal. No safe dose is known." },
                  { item: "Onions, Garlic, Leeks, Chives", risk: "HIGH", detail: "Thiosulfate destroys red blood cells (hemolytic anemia). Toxic raw, cooked, or powdered. Garlic at small doses is controversial — avoid to be safe." },
                  { item: "Xylitol (artificial sweetener)", risk: "EXTREME", detail: "Causes insulin surge and liver failure. Found in sugar-free gum, nut butters, some baked goods. Read labels." },
                  { item: "Macadamia Nuts", risk: "HIGH", detail: "Causes weakness, tremors, hyperthermia. Mechanism unknown. Call vet immediately." },
                  { item: "Avocado", risk: "MODERATE", detail: "Persin in leaves, skin, and pit is toxic. The flesh is generally low risk but can cause GI upset. Pit is an obstruction hazard." },
                  { item: "Alcohol", risk: "EXTREME", detail: "Ethanol poisoning: even small amounts cause CNS depression, respiratory failure. Emergency situation." },
                  { item: "Cooked Bones", risk: "HIGH", detail: "Cooking makes bones brittle — they splinter and can perforate the esophagus, stomach, or intestines. Only raw bones are safe." },
                  { item: "Nutmeg", risk: "HIGH", detail: "Myristicin causes seizures, tremors, and CNS problems. Found in many holiday baked goods." },
                  { item: "Corn on the Cob", risk: "MODERATE", detail: "Not toxic, but the cob is a severe obstruction risk. Can be fatal if lodged in the intestine." },
                ].map(f => (
                  <div key={f.item} className={`p-3 rounded-xl border-l-4 ${f.risk === 'EXTREME' ? 'border-red-600 bg-red-50 dark:bg-red-950/20' : f.risk === 'HIGH' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'}`}>
                    <div className="flex justify-between">
                      <div className="font-semibold text-sm">{f.item}</div>
                      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.risk === 'EXTREME' ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : f.risk === 'HIGH' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'}`}>{f.risk}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{f.detail}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-2">In any suspected poisoning, call ASPCA Animal Poison Control: <strong className="text-foreground">(888) 426-4435</strong> (fee may apply) or your nearest emergency vet immediately.</p>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  );
}
