import { ElementiaActor } from "./documents/actor.js";
import { ElementiaItem } from "./documents/item.js";
import { ElementiaCharacterSheet } from "./sheets/actor-sheet.js";
import { ElementiaItemSheet } from "./sheets/item-sheet.js";

/* -------------------------------------------- */
/*  Inicialização do Sistema                    */
/* -------------------------------------------- */
Hooks.once('init', async function() {
  console.log('Elementia | Inicializando Elementia RPG System');

  CONFIG.Actor.documentClass = ElementiaActor;
  CONFIG.Item.documentClass = ElementiaItem;

  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  Actors.registerSheet("elementia", ElementiaCharacterSheet, { 
    types: ["character", "npc"], 
    makeDefault: true 
  });
  
  Items.registerSheet("elementia", ElementiaItemSheet, { 
    makeDefault: true 
  });

  // A Iniciativa agora puxa apenas o dado + o valor total calculado na ficha
  CONFIG.Combat.initiative = {
    formula: "1d20 + @combat.initiative.total",
    decimals: 2
  };
});

/* -------------------------------------------- */
/*  Automação Tática: Início de Turno           */
/* -------------------------------------------- */
Hooks.on("updateCombat", async (combat, updateData, options, userId) => {
  // Garante que só o Mestre (ou quem estiver processando o combate) atualize os dados para evitar loops
  if (!game.user.isGM) return;

  // Verifica se o turno mudou
  if (updateData.turn !== undefined || updateData.round !== undefined) {
    const currentCombatant = combat.combatant;
    
    if (currentCombatant && currentCombatant.actor) {
      const actor = currentCombatant.actor;
      
      // Regra de Game Design: Recarrega 3 Ações e 1 Reação no início do turno
      await actor.update({
        "system.combat.actionPoints.value": actor.system.combat.actionPoints.max,
        "system.combat.reactions.value": actor.system.combat.reactions.max
      });
      
      console.log(`Elementia | Turno de ${actor.name} iniciado. Ações e Reações restauradas.`);
    }
  }
});

/* -------------------------------------------- */
/*  Hooks de Preparação                         */
/* -------------------------------------------- */
Hooks.on("ready", function() {
  console.log("Elementia | Sistema Pronto. Conectado ao banco de dados com sucesso.");
});
