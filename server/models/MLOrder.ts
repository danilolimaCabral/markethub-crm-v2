import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MLOrderAttributes {
  id: number;
  tenantId: number;
  integrationId: number;
  orderId: number | null; // ID do pedido local no CRM
  mlOrderId: string; // ID do pedido no Mercado Livre
  status: string;
  dateCreated: Date;
  dateClosed: Date | null;
  totalAmount: number;
  paidAmount: number;
  currencyId: string;
  buyerId: string;
  buyerNickname: string | null;
  items: any; // JSON com itens do pedido
  payments: any; // JSON com informações de pagamento
  shipping: any; // JSON com informações de envio
  lastSyncAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MLOrderCreationAttributes
  extends Optional<
    MLOrderAttributes,
    'id' | 'orderId' | 'dateClosed' | 'buyerNickname' | 'createdAt' | 'updatedAt'
  > {}

class MLOrder extends Model<MLOrderAttributes, MLOrderCreationAttributes> implements MLOrderAttributes {
  public id!: number;
  public tenantId!: number;
  public integrationId!: number;
  public orderId!: number | null;
  public mlOrderId!: string;
  public status!: string;
  public dateCreated!: Date;
  public dateClosed!: Date | null;
  public totalAmount!: number;
  public paidAmount!: number;
  public currencyId!: string;
  public buyerId!: string;
  public buyerNickname!: string | null;
  public items!: any;
  public payments!: any;
  public shipping!: any;
  public lastSyncAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MLOrder.init(
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
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    mlOrderId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateCreated: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    dateClosed: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paidAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currencyId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    buyerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    buyerNickname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    payments: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    shipping: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    lastSyncAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'ml_orders',
    timestamps: true,
  }
);

export default MLOrder;
