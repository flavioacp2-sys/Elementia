import { ElementiaActor } from "./documents/actor.js";
import { ElementiaItem } from "./documents/item.js";
import { ElementiaCharacterSheet } from "./sheets/actor-sheet.js";
import { ElementiaItemSheet } from "./sheets/item-sheet.js";

/* -------------------------------------------- */
/*  Inicialização do Sistema                    */
/* -------------------------------------------- */
Hooks.once('init', async function() {
  console.log('Elementia | Inicializando Elementia RPG System');

  // 1. Substitui as classes padrão do Foundry pelas nossas
  CONFIG.Actor.documentClass = ElementiaActor;
  CONFIG.Item.documentClass = ElementiaItem;

  // 2. Remove as fichas (sheets) cinzas nativas do sistema
  Actors.unregisterSheet("core", ActorSheet);
  Items.unregisterSheet("core", ItemSheet);

  // 3. Registra as nossas fichas estilizadas
  Actors.registerSheet("elementia", ElementiaCharacterSheet, { 
    types: ["character", "npc"], 
    makeDefault: true 
  });
  
  Items.registerSheet("elementia", ElementiaItemSheet, { 
    makeDefault: true 
  });

  // 4. Configura a Matemática do Rastreador de Combate (Iniciativa)
  // O sistema puxará automaticamente o Reflexos + Percepção do Ator
  CONFIG.Combat.initiative = {
    formula: "1d20 + @combat.initiative.total",
    decimals: 2
  };
});

/* -------------------------------------------- */
/*  Automação Tática: Início de Turno           */
/* -------------------------------------------- */
Hooks.on("updateCombat", async (combat, updateData, options, userId) => {
  // Garante que apenas a máquina do Mestre processe isso, evitando loops se houver 5 jogadores
  if (!game.user.isGM) return;

  // Verifica se o turno ou o round realmente mudaram
  if (updateData.turn !== undefined || updateData.round !== undefined) {
    const currentCombatant = combat.combatant;
    
    if (currentCombatant && currentCombatant.actor) {
      const actor = currentCombatant.actor;
      
      // Regra de Game Design: Recarrega Ações e Reações no início do turno
      const maxActions = actor.system.attributes.actionPoints.max;
      const maxReactions = actor.system.attributes.reactions.max;

      await actor.update({
        "system.attributes.actionPoints.value": maxActions,
        "system.attributes.reactions.value": maxReactions
      });
      
      console.log(`Elementia | Turno de ${actor.name} iniciado. Ações e Reações restauradas.`);
    }
  }
});

/* -------------------------------------------- */
/*  Sistema Pronto                              */
/* -------------------------------------------- */
Hooks.once("ready", function() {
  console.log("Elementia | Sistema carregado com sucesso. Bem-vindo à mesa!");
});
