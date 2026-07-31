export class ElementiaActor extends Actor {
  
  /** 
   * @override 
   * Prepara os dados derivados do sistema toda vez que a ficha é carregada ou atualizada.
   */
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
    // Combate
    skills.combat.perception.total = skills.combat.perception.rank + skills.combat.perception.bonus;
    skills.combat.reflexes.total = skills.combat.reflexes.rank + skills.combat.reflexes.bonus;
    skills.combat.resilience.total = skills.combat.resilience.rank + skills.combat.resilience.bonus;
    
    // Gerais
    skills.general.athletics.total = skills.general.athletics.rank + skills.general.athletics.bonus;
    skills.general.insight.total = skills.general.insight.rank + skills.general.insight.bonus;
    skills.general.investigation.total = skills.general.investigation.rank + skills.general.investigation.bonus;

    // 2. VALORES PASSIVOS (Total da Perícia + 10)
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
  }
}
