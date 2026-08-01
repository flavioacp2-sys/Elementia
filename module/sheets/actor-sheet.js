export class ElementiaCharacterSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["elementia", "sheet", "actor"],
      template: "systems/elementia/module/documents/actor-sheet.html",
      width: 800,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "combate" }] // Ativa as abas
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;

    // Filtros para a Aba de Habilidades
    context.habilidadesRaciais = context.items.filter(i => i.type === 'ability' && i.system.sourceType === 'racial');
    context.habilidadesClasse = context.items.filter(i => i.type === 'ability' && i.system.sourceType === 'class');

    // Filtros para a Aba de Inventário
    context.weapons = context.items.filter(i => i.type === 'weapon');
    context.armors = context.items.filter(i => i.type === 'armor' || i.type === 'shield');
    context.gears = context.items.filter(i => i.type === 'gear');

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Tudo abaixo desta linha só funciona se o jogador for dono da ficha
    if (!this.isEditable) return;

    // =====================================
    // OUVINTE: ROLAGEM DE PERÍCIAS
    // =====================================
    html.find('.skill-roll').click(this._onRollSkill.bind(this));
  }

  /**
   * Função que executa a rolagem ao clicar no dado (d20)
   */
  async _onRollSkill(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const skillKey = element.dataset.skill; // Pega o nome da perícia clicada (ex: "athletics")
    const system = this.actor.system;
    
    let skillTotal = 0;
    let skillName = skillKey;

    // Procura em qual categoria a perícia está para pegar o Valor Total (Graduação + Bônus)
    const categories = ['combat', 'general', 'knowledge', 'crafting'];
    for (let cat of categories) {
        if (system.skills[cat][skillKey]) {
            skillTotal = system.skills[cat][skillKey].total;
            // Para deixar o chat bonito, capitaliza a primeira letra do ID (ex: athletics -> Athletics)
            skillName = skillKey.charAt(0).toUpperCase() + skillKey.slice(1); 
            break;
        }
    }

    // Fórmula Base: 1d20 + Total da Perícia
    let rollFormula = `1d20 + ${skillTotal}`;
    let roll = new Roll(rollFormula);
    
    // Executa a rolagem
    await roll.evaluate({async: true});

    // Envia para o chat
    roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Teste de Perícia: <b>${skillName}</b>`
    });
  }
}
