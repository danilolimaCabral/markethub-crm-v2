import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MercadoLivreIntegrationAttributes {
  id: number;
  tenantId: number;
  userId: number;
  mlUserId: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  isActive: boolean;
  lastSync: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MercadoLivreIntegrationCreationAttributes
  extends Optional<MercadoLivreIntegrationAttributes, 'id' | 'lastSync' | 'createdAt' | 'updatedAt'> {}

class MercadoLivreIntegration
  extends Model<MercadoLivreIntegrationAttributes, MercadoLivreIntegrationCreationAttributes>
  implements MercadoLivreIntegrationAttributes
{
  public id!: number;
  public tenantId!: number;
  public userId!: number;
  public mlUserId!: string;
  public accessToken!: string;
  public refreshToken!: string;
  public tokenExpiresAt!: Date;
  public isActive!: boolean;
  public lastSync!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MercadoLivreIntegration.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    mlUserId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastSync: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'mercadolivre_integrations',
    timestamps: true,
  }
);

export default MercadoLivreIntegration;
