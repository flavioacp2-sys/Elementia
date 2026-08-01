export class ElementiaActor extends Actor {
  
  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    const systemData = this.system;
    
    if (this.type === 'character') {
      this._prepareCharacterData(systemData);
    }
  }

  _prepareCharacterData(system) {
    const skills = system.skills;

// 1. CÁLCULO DE PERÍCIAS (Total = Graduação + Bônus)
    // Regra de Limite por Nível: lv1=3, lv2=4, lv3-10=5, lv11-20=10.
    const level = system.attributes.level.value || 1;
    let maxRank = 3;
    
    if (level === 2) {
        maxRank = 4;
    } else if (level >= 3 && level <= 10) {
        maxRank = 5;
    } else if (level >= 11) {
        maxRank = 10;
    }

    for (let category in skills) {
      for (let skillKey in skills[category]) {
        let skill = skills[category][skillKey];
        
        // Aplica a trava matemática (Cap)
        let effectiveRank = skill.rank;
        if (effectiveRank > maxRank) {
            effectiveRank = maxRank;
            console.warn(`Elementia | A graduação da perícia excedeu o limite do Nível ${level}. Reduzindo para ${maxRank}.`);
        }
        
        skill.total = effectiveRank + skill.bonus;
      }
    }

    // 2. VALORES PASSIVOS ESPECÍFICOS (Total da Perícia + 10)
    skills.combat.perception.passive = skills.combat.perception.total + 10;
    skills.general.insight.passive = skills.general.insight.total + 10;
    skills.general.investigation.passive = skills.general.investigation.total + 10;

    // 3. INICIATIVA (Reflexos + Percepção)
    system.combat.initiative.total = skills.combat.reflexes.total + skills.combat.perception.total;

    // 4. CÁLCULO DE CARGA (REGRA BASE: Resiliência + Atletismo * 5)
    let resiliencia = skills.combat.resilience.total;
    let atletismo = skills.general.athletics.total;
    let cargaLeve = resiliencia + (atletismo * 5);
    
    // Aplica a regra de limite mínimo de 10 KG
    if (cargaLeve < 10) {
      cargaLeve = 10;
    }

    // Define as categorias de carga na ficha
    system.attributes.carga.leve = cargaLeve;
    system.attributes.carga.media = Math.floor(cargaLeve * 1.5);
    system.attributes.carga.pesada = cargaLeve * 2;
    system.attributes.carga.erguer = Math.floor(cargaLeve * 2.5);
    system.attributes.carga.arrastar = cargaLeve * 3.5;

    // ========================================================================
    // 5. PROCESSAMENTO DE RAÇA E ORIGEM
    // ========================================================================
    
    // Garante que os atributos base existam para evitar erros de inicialização
    if (!system.attributes.movement) {
      system.attributes.movement = { value: 6, alt: "" };
      system.attributes.vision = { value: "Normal" };
      system.attributes.size = { value: "Médio" };
    }

    // Procura no inventário do Ator se ele possui itens
    const raceItem = this.items.find(i => i.type === "race");

    if (raceItem) {
      const raceData = raceItem.system;
      system.attributes.movement.value = raceData.movement || 6;
      system.attributes.vision.value = raceData.vision || "Normal";
      system.attributes.size.value = raceData.size || "Médio";
      
      // Regras específicas de movimentação (Voo, Nado)
      if (raceData.movementAlt) {
         system.attributes.movement.alt = raceData.movementAlt; 
      }
    } // A CHAVE QUE FALTAVA ESTAVA AQUI

    // ========================================================================
    // 6. CÁLCULO DE RECURSOS DINÂMICOS (MANOBRA, ESTAMINA, MANA, ETC)
    // ========================================================================
    
    const characterClass = this.items.find(i => i.type === "class");
    
    if (characterClass) {
        const classData = characterClass.system;
        const level = system.attributes.level.value || 1;
        const halfLevel = Math.max(1, Math.floor(level / 2)); // Regra: mínimo de 1

        // Calcula o Recurso Primário (Ex: Manobra ou Mana)
        if (classData.resource1 && classData.resource1.name) {
            system.attributes.resources.primario.label = classData.resource1.name;
            
            let skillBonus = 0;
            // Busca o bônus na aba de combate (ex: training, marksmanship, thievery, runeMagic)
            if (classData.resource1.skillBonus && skills.combat[classData.resource1.skillBonus]) {
                skillBonus = skills.combat[classData.resource1.skillBonus].total;
            }
            
            system.attributes.resources.primario.max = halfLevel + skillBonus;
        }

        // Calcula o Recurso Secundário (Ex: Estamina ou Runa)
        if (classData.resource2 && classData.resource2.name) {
            system.attributes.resources.secundario.label = classData.resource2.name;
            system.attributes.resources.secundario.max = halfLevel; 
        }

      // ========================================================================
    // 7. PROCESSAMENTO DE INVENTÁRIO (Peso Total e Defesas de Equipamentos)
    // ========================================================================
    
    let pesoAtual = 0;
    let bonusBloqueioEquipamento = 0;
    let penalidadeEsquivaEquipamento = 0;

    // Faz um loop por todos os itens que o personagem possui
    for (let item of this.items) {
        const itemData = item.system;
        
        // 1. Soma do Peso (Garante que ferramentas com múltiplas unidades sejam somadas corretamente)
        const peso = itemData.weight || 0;
        const quantidade = itemData.quantity || 1;
        pesoAtual += (peso * quantidade);

        // 2. Extração de Status de Combate (Apenas se o item estiver EQUIPADO)
        if (itemData.equipped) {
            if (item.type === 'armor') {
                bonusBloqueioEquipamento += (itemData.physicalResist || 0);
                penalidadeEsquivaEquipamento += (itemData.dodgePenalty || 0);
            }
            else if (item.type === 'shield') {
                bonusBloqueioEquipamento += (itemData.blockBonus || 0);
                penalidadeEsquivaEquipamento += (itemData.dodgePenalty || 0);
            }
        }
    }

    // Salva o peso total arredondado para evitar números infinitos (ex: 1.33333)
    system.attributes.carga.atual = parseFloat(pesoAtual.toFixed(2));

    // 3. Aplica a Regra de Game Design para as Defesas
    // Bloqueio = Resiliência Total + Bônus do Equipamento
    system.defenses.block.bonus = bonusBloqueioEquipamento;
    system.defenses.block.total = system.skills.combat.resilience.total + bonusBloqueioEquipamento;

    // Esquiva = Reflexos Total - Penalidade do Equipamento
    system.defenses.dodge.bonus = penalidadeEsquivaEquipamento; 
    system.defenses.dodge.total = system.skills.combat.reflexes.total - Math.abs(penalidadeEsquivaEquipamento);
    }
  }
}
