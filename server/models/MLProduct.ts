import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MLProductAttributes {
  id: number;
  tenantId: number;
  integrationId: number;
  productId: number | null; // ID do produto local no CRM
  mlItemId: string; // ID do item no Mercado Livre
  title: string;
  price: number;
  availableQuantity: number;
  soldQuantity: number;
  status: 'active' | 'paused' | 'closed';
  permalink: string;
  thumbnail: string | null;
  categoryId: string;
  listingTypeId: string;
  condition: 'new' | 'used';
  lastSyncAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MLProductCreationAttributes
  extends Optional<MLProductAttributes, 'id' | 'productId' | 'thumbnail' | 'createdAt' | 'updatedAt'> {}

class MLProduct extends Model<MLProductAttributes, MLProductCreationAttributes> implements MLProductAttributes {
  public id!: number;
  public tenantId!: number;
  public integrationId!: number;
  public productId!: number | null;
  public mlItemId!: string;
  public title!: string;
  public price!: number;
  public availableQuantity!: number;
  public soldQuantity!: number;
  public status!: 'active' | 'paused' | 'closed';
  public permalink!: string;
  public thumbnail!: string | null;
  public categoryId!: string;
  public listingTypeId!: string;
  public condition!: 'new' | 'used';
  public lastSyncAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MLProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id',
      },
    },
    integrationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'mercadolivre_integrations',
        key: 'id',
      },
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    mlItemId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    availableQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    soldQuantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('active', 'paused', 'closed'),
      allowNull: false,
      defaultValue: 'active',
    },
    permalink: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    listingTypeId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    condition: {
      type: DataTypes.ENUM('new', 'used'),
      allowNull: false,
      defaultValue: 'new',
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ml_products',
    timestamps: true,
  }
);

export default MLProduct;
