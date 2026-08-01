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
    // Usando um loop profissional para calcular TODAS as perícias de todas as categorias automaticamente
    for (let category in skills) {
      for (let skillKey in skills[category]) {
        let skill = skills[category][skillKey];
        skill.total = skill.rank + skill.bonus;
      }
    }

    // 2. VALORES PASSIVOS ESPECÍFICOS (Total da Perícia + 10)
    skills.combat.perception.passive = skills.combat.perception.total + 10;
    skills.general.insight.passive = skills.general.insight.total + 10;
    skills.general.investigation.passive = skills.general.investigation.total + 10;

    // 3. INICIATIVA (Reflexos + Percepção)
    system.combat.initiative.total = skills.combat.reflexes.total + skills.combat.perception.total;

    // 4. CAPACIDADE DE CARGA ((Resiliência + Atletismo) * 5. Mínimo de 10)
    let lightWeight = (skills.combat.resilience.total + skills.general.athletics.total) * 5;
    if (lightWeight < 10) lightWeight = 10;
    
    system.carryWeight.light = lightWeight;
    system.carryWeight.medium = lightWeight * 1.5;
    system.carryWeight.heavy = lightWeight * 2;
    system.carryWeight.lift = lightWeight * 2.5;
    system.carryWeight.drag = lightWeight * 3.5;

    // ========================================================================
    // 5. PROCESSAMENTO DE RAÇA E ORIGEM
    // ========================================================================
    
    // Garante que os atributos base existam para evitar erros de inicialização
    if (!system.attributes) {
      system.attributes = { movement: { value: 6 }, vision: { value: "Normal" }, size: { value: "Médio" } };
    }

    // Procura no inventário do Ator se ele possui itens do tipo "race" ou "origin"
    const raceItem = this.items.find(i => i.type === "race");
    const originItem = this.items.find(i => i.type === "origin");

    if (raceItem) {
      const raceData = raceItem.system;
      
      // Aplica os dados da raça aos atributos vitais do personagem
      system.attributes.movement.value = raceData.movement || 6;
      system.attributes.vision.value = raceData.vision || "Normal";
      system.attributes.size.value = raceData.size || "Médio";
      
      // Verifica regras específicas de movimentação, como as exceções de voo
      // Exemplo: O Draconiano Asas Poderosas e o Feralis Errantis possuem regras mistas de voo/solo
      if (raceData.movementAlt) {
         system.attributes.movement.alt = raceData.movementAlt; // Para guardar "Voo 6" ou "Nadar 6"

       // ========================================================================
      // 6. CÁLCULO DE CARGA (REGRA BASE)
      // ========================================================================
    
      // Puxa os valores das perícias, assumindo 0 se não existirem
      let resiliencia = system.skills?.resiliencia?.value || 0;
      let atletismo = system.skills?.atletismo?.value || 0;
  
      // Calcula a carga leve base (Resiliência + Atletismo x 5)
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
    
    // ========================================================================
    // CÁLCULO DE RECURSOS DINÂMICOS (MANOBRA, ESTAMINA, MANA, ETC)
    // ========================================================================
    
    // 1. Encontra a classe equipada
    const characterClass = this.items.find(i => i.type === "class");
    
    if (characterClass) {
        const classData = characterClass.system;
        const level = system.attributes.level.value;
        const halfLevel = Math.max(1, Math.floor(level / 2)); // Regra: mínimo de 1

        // 2. Calcula o Recurso Primário (Ex: Manobra ou Mana)
        if (classData.resource1) {
            system.attributes.resources.primario.label = classData.resource1.name;
            
            // Puxa o valor da perícia vinculada (se existir). Ex: 'treinamento' ou 'magia_runica'
            let skillBonus = 0;
            if (classData.resource1.skillBonus && system.skills[classData.resource1.skillBonus]) {
                skillBonus = system.skills[classData.resource1.skillBonus].value;
            }
            
            // Aplica a fórmula matemática
            system.attributes.resources.primario.max = halfLevel + skillBonus;
        }

        // 3. Calcula o Recurso Secundário (Ex: Estamina ou Runa)
        if (classData.resource2) {
            system.attributes.resources.secundario.label = classData.resource2.name;
            system.attributes.resources.secundario.max = halfLevel; // Geralmente não usa perícia, apenas 1/2 lvl
        }
    }
      }
    }
  }
}
