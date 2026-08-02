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

    // OUVINTE: ROLAGEM DE DEFESAS ATIVAS
    html.find('.defense-roll').click(this._onRollDefense.bind(this));
    
    // =====================================
    // OUVINTES: GERENCIAMENTO DE ITENS
    // =====================================
    
    // 1. Botão de Editar Item (Abre a ficha do item)
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) item.sheet.render(true);
    });

    // 2. Botão de Deletar Item (Exclui do inventário/habilidades com confirmação)
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (item) {
        // Pede confirmação antes de apagar para evitar acidentes
        Dialog.confirm({
          title: "Deletar Item",
          content: `<p>Tem certeza que deseja deletar <b>${item.name}</b>?</p>`,
          yes: () => item.delete(),
          defaultYes: false
        });
      }
    });

    // 3. Botão de Equipar/Desequipar (Muda o status do item)
    html.find('.item-equip-toggle').click(async ev => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      
      if (item) {
        // Inverte o valor atual (se estava true, vira false, e vice-versa)
        const isEquipped = item.system.equipped;
        await item.update({ "system.equipped": !isEquipped });
      }
    });
    
    // Rolar Ataque com Arma
    html.find('.item-roll').click(this._onItemRoll.bind(this));
    
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

  /**
   * Executa a rolagem de Ataque e Dano ao clicar no ícone da Arma
   */
  async _onItemRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const li = $(element).parents(".item");
    const item = this.actor.items.get(li.data("itemId"));

  /**
   * Executa a rolagem ao clicar no painel de Defesas
   */
  async _onRollDefense(event) {
    event.preventDefault();
    const defenseKey = event.currentTarget.dataset.defense; 
    const defenseData = this.actor.system.defenses[defenseKey];
    
    const names = {
        block: "Bloqueio",
        dodge: "Esquiva",
        counter: "Contra-Ataque"
    };

    let roll = new Roll(`1d20 + ${defenseData.total}`);
    await roll.evaluate({async: true});

    roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `Defesa Ativa: <b style="color: #7a3b3b;">${names[defenseKey]}</b>`
    });
  }
    
    // Garante que só armas possam rolar ataques por aqui
    if (item.type !== "weapon") return;

    const itemData = item.system;
    const skills = this.actor.system.skills.combat;

    // 1. Define qual perícia usar baseado no Alcance (Range)
    let attackMod = 0;
    let skillName = "";

    // Se for Corpo a Corpo ou Arremesso (Usa Habilidade com Armas)
    if (itemData.range.toLowerCase().includes("corpo a corpo") || itemData.properties.thrown) {
        attackMod = skills.weaponSkill.total;
        skillName = "Habilidade com Armas";
    } 
    // Se for à Distância (Usa Precisão)
    else {
        attackMod = skills.precision.total;
        skillName = "Precisão";
    }

    // 2. Rolagem de Acerto (1d20 + Perícia)
    let attackRoll = new Roll(`1d20 + ${attackMod}`);
    await attackRoll.evaluate({async: true});

    // 3. Rolagem de Dano (Dado da Arma)
    let damageFormula = itemData.damage || "1d6";
    let damageRoll = new Roll(damageFormula);
    await damageRoll.evaluate({async: true});

    // 4. Constrói o HTML bonito para o Chat Message do Foundry
    const chatHTML = `
        <div class="elementia-chat-card">
            <h3 style="border-bottom: 2px solid #7a3b3b; margin-bottom: 5px; padding-bottom: 3px;">
                <img src="${item.img}" width="20" height="20" style="vertical-align: middle; margin-right: 5px; border: none;"/>
                Ataca com ${item.name}
            </h3>
            <div style="font-size: 12px; margin-bottom: 8px; color: #555;">
                <strong>Perícia:</strong> ${skillName} (+${attackMod}) <br>
                <strong>Propriedades:</strong> ${itemData.range} | ${itemData.damageType}
            </div>
            
            <div style="background: rgba(0,0,0,0.05); padding: 5px; border: 1px solid #c9c7b8; border-radius: 3px; margin-bottom: 5px;">
                <div style="font-weight: bold; color: #3b577a; font-size: 14px;">Acerto: [[${attackRoll.result}]]</div>
            </div>
            
            <div style="background: rgba(122,59,59,0.1); padding: 5px; border: 1px solid #a87979; border-radius: 3px;">
                <div style="font-weight: bold; color: #7a3b3b; font-size: 14px;">Dano: [[${damageRoll.result}]] <span style="font-size: 11px; font-weight: normal;">(${itemData.damageType})</span></div>
            </div>
        </div>
    `;

    // 5. Envia a mensagem para o chat do jogo
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: chatHTML,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
  }
}
