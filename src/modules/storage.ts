import { ExtendableProxy } from "@utils/index";
import { Sequelize, DataTypes, Model, ModelCtor } from "sequelize";
import {
  ClassConstructor,
  plainToClass,
  serialize,
  deserialize,
  classToClass,
} from "class-transformer";
import { Collection } from "discord.js";

// const sequelizee = new Sequelize({
//   dialect: "sqlite",
//   storage: "./database.sqlite",
// });

interface ModelStore {
  id: string;
  data: string;
}

type ClassModel<Class> = new (...args: any[]) => Class;

type StoreItemBase<T> = {
  [K in keyof T]: T[K];
};

type ExtendsStoreItem<T> = {
  _forceSync(): Promise<boolean>;
};

type StoreItem<T> = StoreItemBase<T> & ExtendsStoreItem<T>;

type SequelizeModelStore = ModelCtor<Model<ModelStore>>;

export class Storage {
  private _sequelize: Sequelize;
  constructor(sequelize?: Sequelize) {
    this._sequelize = sequelize ?? new Sequelize("sqlite::memory");
  }

  async newStore<Class>(name: string, model: ClassModel<Class>) {
    const SequelizeModel: ModelCtor<Model<ModelStore>> = this._sequelize.define(
      name,
      {
        id: {
          type: DataTypes.STRING,
          unique: true,
          primaryKey: true,
        },
        data: DataTypes.STRING(65536),
      }
    );
    await SequelizeModel.sync();
    return await new Store<Class>(SequelizeModel, model).init();
  }
}

export class Store<Class> extends Collection<string, StoreItem<Class>> {
  private _clientStore: SequelizeModelStore;
  private _model: ClassModel<Class>;
  private _dbItems: Collection<string, Model<ModelStore>>;

  constructor(sequelizeModel: SequelizeModelStore, model: ClassModel<Class>) {
    super();
    this._clientStore = sequelizeModel;
    this._model = model;
    this._dbItems = new Collection();
  }

  private async _syncItem(id: string, data: StoreItem<Class>) {
    const item = this._dbItems.get(id);
    if (!item)
      throw new Error(`Sync: StoreItem with id '${id}' not found in Store`);

    item.setDataValue("data", this.getJsonData(data));
    // await item.save();
    try {
      if (!item.isNewRecord) {
        await item.save();
      } else {
        const data = await this._clientStore.update(
          { data: item.getDataValue("data") },
          {
            where: {
              id,
            },
          }
        );
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  private getJsonData(data: StoreItem<Class>) {
    return serialize(data, {
      excludePrefixes: ["_"],
      enableCircularCheck: true,
    });
  }

  async saveAll() {
    const All = await Promise.all(
      super.map(async (item, id) => this._syncItem(id, item))
    );
    return All.every((item) => item);
  }

  private newItem(id: string, data?: Object) {
    const StoreItem = plainToClass(this._model, data ?? {}) as StoreItem<Class>;

    if (!this._dbItems.has(id)) {
      const DbItem = this._clientStore.build({
        id,
        data: this.getJsonData(StoreItem),
      });

      this._dbItems.set(id, DbItem);
      DbItem.save();
    }

    StoreItem._forceSync = this._syncItem.bind(this, id, StoreItem);
    super.set(id, StoreItem);

    return StoreItem;
  }

  delete(id: string) {
    if (!super.has(id) || !this._dbItems.has(id)) return false;
    const itemDB = this._dbItems.get(id);
    if (!itemDB) return false;
    itemDB.destroy();
    this._clientStore.destroy({
      where: {
        id,
      },
    });

    return super.delete(id) && this._dbItems.delete(id);
  }

  new(id: string) {
    let item = super.get(id);

    if (!item) item = this.newItem(id);
    return item;
  }

  async init() {
    const ALL_ITEM = await this._clientStore.findAll();

    for (const ITEM of ALL_ITEM) {
      const id = ITEM.getDataValue("id");
      this._dbItems.set(id, ITEM);
      // const data = deserialize(this._model, ITEM.getDataValue("data"));
      const data = JSON.parse(ITEM.getDataValue("data"));

      this.newItem(id, data);
    }
    return this;
  }
}
