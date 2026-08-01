export class ElementiaItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["elementia", "sheet", "item"],
      template: "systems/elementia/module/documents/item-sheet.html",
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "detalhes" }]
    });
  }

  /** @override */
  getData() {
    const context = super.getData();
    const itemData = this.item.toObject(false);
    
    // Passa os dados do system para facilitar o HTML
    context.system = itemData.system;

    // Cria as flags para o HTML saber qual bloco renderizar
    context.isWeapon = this.item.type === "weapon";
    context.isArmor = this.item.type === "armor";
    context.isShield = this.item.type === "shield";
    context.isGear = this.item.type === "gear";
    context.isAbility = this.item.type === "ability";
    context.isClass = this.item.type === "class";

    // Prepara o editor de texto rico da descrição
    context.enrichedDescription = async () => {
      return await TextEditor.enrichHTML(this.item.system.description, {async: true});
    };

    return context;
  }
}
