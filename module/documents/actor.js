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
      }
    }
  }
}
