export class ElementiaItem extends Item {
  
  /** 
   * @override 
   * Prepara os dados do Item antes de enviá-los para a ficha ou rolagem.
   */
  prepareData() {
    super.prepareData();
    const itemData = this.system;

    if (this.type === 'weapon') {
      this._prepareWeaponData(itemData);
    }
  }

  _prepareWeaponData(system) {
    // Regra: Armas de Duas Mãos ganham +2 de acerto nativo.
    if (system.properties.twoHanded) {
      system.attackBonus = 2;
    } else {
      system.attackBonus = 0;
    }

    // Regra: O limite de encaixes de atributos depende da Qualidade e do Tipo de Arma.
    // Usaremos uma matriz interna para travar o limite mágico posteriormente no código UI.
    system.maxAttributes = this._calculateAttributeSlots(system.quality, system.weaponGroup);
  }

  _calculateAttributeSlots(quality, group) {
    // Lógica simplificada de matriz.
    // Ex: Adaga Comum = 2. Adaga Obra-Prima = 5.
    const slots = {
      "Mundana": 1,
      "Comum": 2,
      "Incomum": 3,
      "Rara": 4,
      "Obra-Prima": 5,
      "Épica": 5,
      "Lendária": 6
    };
    return slots[quality] || 0;
  }
}
