import { Sequelize } from 'sequelize';

// Configuração do Sequelize para PostgreSQL
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: {
        max: 20,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: false,
          rejectUnauthorized: false
        } : false
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'markethub',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 20,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );

// Teste de conexão
sequelize.authenticate()
  .then(() => {
    console.log('✅ Sequelize conectado ao PostgreSQL');
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar Sequelize:', err);
  });

export default sequelize;
