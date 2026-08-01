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
    } else if (this.type === 'armor' || this.type === 'shield') {
      this._prepareArmorData(itemData);
    }
  }

  _prepareWeaponData(system) {
    // Regra: Armas de Duas Mãos ganham +2 de acerto nativo antes de outros bônus
    if (system.properties.twoHanded) {
      system.attackBonus = 2;
    } else {
      system.attackBonus = 0;
    }

    // Calcula dinamicamente o número de slots (encaixes) para atributos da arma
    system.maxAttributes = this._calculateWeaponAttributeSlots(system.quality, system.weaponType);
  }

  _prepareArmorData(system) {
    // Calcula dinamicamente o número de slots (encaixes) para armaduras, vestes e escudos
    system.maxAttributes = this._calculateArmorAttributeSlots(system.quality, system.armorType);
  }

  /**
   * Calcula os encaixes de atributos baseados no subtipo da arma e qualidade.
   */
  _calculateWeaponAttributeSlots(quality, type) {
    // Índices de Qualidade: 
    // 0: Mundana, 1: Comum, 2: Incomum, 3: Rara, 4: Obra-Prima, 5: Épica, 6: Lendária
    const qualityIndex = {
      "Mundana": 0, "Comum": 1, "Incomum": 2, "Rara": 3, "Obra-Prima": 4, "Épica": 5, "Lendária": 6
    };

    const index = qualityIndex[quality] !== undefined ? qualityIndex[quality] : 0;

    // Matriz de progressão extraída do Game Design
    const weaponMatrix = {
      "Adaga": [1, 2, 3, 4, 5, 5, 6],
      "Espada Curta": [1, 2, 3, 4, 6, 6, 7],
      "Espada Longa": [1, 2, 4, 5, 6, 6, 7],
      "Espada de Duas Mãos": [2, 3, 4, 5, 6, 7, 8],
      "Machado": [1, 2, 3, 4, 6, 6, 7],
      "Machado de Duas Mãos": [2, 3, 4, 5, 6, 6, 7],
      "Arma de Haste": [2, 3, 4, 5, 6, 7, 8],
      "Chicote": [1, 2, 3, 5, 6, 6, 7],
      "Mangual": [1, 2, 3, 4, 6, 6, 7],
      "Maça": [1, 2, 3, 4, 5, 5, 6],
      "Martelos": [1, 2, 3, 4, 5, 5, 6],
      "Lanças": [1, 2, 3, 4, 5, 5, 6],
      "Manoplas": [1, 2, 3, 4, 5, 5, 6],
      "Implementos": [1, 2, 3, 4, 5, 5, 6],
      "Armas de Fogo": [1, 2, 2, 3, 4, 4, 5],
      "Bestas": [1, 2, 2, 3, 4, 5, 6],
      "Arcos": [1, 2, 3, 4, 5, 6, 7]
    };

    // Retorna o valor exato ou um padrão defensivo de 0
    if (weaponMatrix[type]) {
      return weaponMatrix[type][index];
    }
    return 0;
  }

  /**
   * Calcula os encaixes de atributos baseados no subtipo da armadura/escudo e qualidade.
   */
  _calculateArmorAttributeSlots(quality, type) {
    const qualityIndex = {
      "Mundana": 0, "Comum": 1, "Incomum": 2, "Rara": 3, "Obra-Prima": 4, "Épica": 5, "Lendária": 6
    };

    const index = qualityIndex[quality] !== undefined ? qualityIndex[quality] : 0;

    // Matriz de progressão extraída do Game Design
    const armorMatrix = {
      "Veste": [1, 2, 2, 3, 3, 4, 5],
      "Armadura Leve": [1, 2, 2, 3, 3, 4, 5],
      "Armadura Média": [1, 2, 3, 3, 4, 4, 6],
      "Armadura Pesada": [1, 2, 3, 3, 4, 5, 6],
      "Escudo": [1, 2, 2, 3, 3, 4, 5],
      "Barda de Montaria": [1, 2, 2, 3, 3, 4, 5]
    };

    if (armorMatrix[type]) {
      return armorMatrix[type][index];
    }
    return 0;
  }
}
