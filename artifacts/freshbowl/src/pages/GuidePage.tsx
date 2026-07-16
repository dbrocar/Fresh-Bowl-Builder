import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function GuidePage() {
  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">FreshBowl Guide</h2>
        <p className="text-muted-foreground text-sm font-medium">Everything you need to know about feeding fresh.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="aspect-video bg-muted relative flex items-center justify-center">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
            title="Choosing the Right Proteins for Your Dog" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>
        <CardContent className="p-4 bg-card">
          <h3 className="font-bold font-serif text-lg mb-1">Choosing Proteins</h3>
          <p className="text-sm text-muted-foreground">Rotate through at least 3 proteins weekly to ensure a full amino acid profile and prevent intolerances.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-bold font-serif text-xl mt-6 px-1">Daily Constants</h3>
        <p className="text-sm text-muted-foreground px-1 mb-4">Add these to every meal to cover nutritional gaps in fresh food.</p>
        
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-none shadow-sm bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-3">
              <div className="text-xl mb-1">🐟</div>
              <div className="font-bold text-sm">Fish Oil</div>
              <div className="text-xs text-muted-foreground mt-1">Omega-3 EPA/DHA. Essential for brain & joints.</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-3">
              <div className="text-xl mb-1">🌿</div>
              <div className="font-bold text-sm">Kelp Powder</div>
              <div className="text-xs text-muted-foreground mt-1">Natural Iodine. Crucial for thyroid health.</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-yellow-50/50 dark:bg-yellow-950/20">
            <CardContent className="p-3">
              <div className="text-xl mb-1">🥚</div>
              <div className="font-bold text-sm">Raw Egg</div>
              <div className="text-xs text-muted-foreground mt-1">Biotin & Choline. Great for coat shine.</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="p-3">
              <div className="text-xl mb-1">🦪</div>
              <div className="font-bold text-sm">GLM</div>
              <div className="text-xs text-muted-foreground mt-1">Green-lipped mussel. Natural joint support.</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 bg-card rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold font-serif text-xl mb-4">Guidelines & Math</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-b-border/50">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">AAFCO Minimums (Adult)</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground space-y-2">
              <div className="flex justify-between border-b pb-1"><span>Protein</span> <span className="font-medium text-foreground">18% DM</span></div>
              <div className="flex justify-between border-b pb-1"><span>Fat</span> <span className="font-medium text-foreground">5.5% DM</span></div>
              <div className="flex justify-between border-b pb-1"><span>Calcium</span> <span className="font-medium text-foreground">0.5% DM</span></div>
              <div className="flex justify-between border-b pb-1"><span>Phosphorus</span> <span className="font-medium text-foreground">0.4% DM</span></div>
              <div className="flex justify-between pt-1"><span>Ca:P Ratio</span> <span className="font-medium text-foreground">1:1 to 2:1</span></div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-none">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">The 70/10/10/10 Rule</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              When building a fresh bowl without synthetic premixes, aim for approximately:
              <br/><br/>
              • <strong>70% Muscle Meat:</strong> Heart, breast, thigh, ground meat.<br/>
              • <strong>10% Raw Bone:</strong> Or equivalent bone meal/calcium source.<br/>
              • <strong>10% Vegetables/Starch:</strong> Lightly steamed or pureed for digestion.<br/>
              • <strong>10% Secreting Organ:</strong> 5% Liver, 5% other (kidney, spleen).<br/>
              <br/>
              FreshBowl simplifies this to protein/organ/veggie/starch blocks while assuming calcium is balanced via constants or bone-in meats.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
