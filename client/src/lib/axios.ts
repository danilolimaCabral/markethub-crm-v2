/**
 * Configuração do Axios com interceptor para autenticação JWT
 * 
 * Este arquivo configura uma instância do Axios que automaticamente:
 * - Adiciona o token JWT em todas as requisições
 * - Trata erros de autenticação (401, 403)
 * - Redireciona para login quando necessário
 */

import axios from 'axios';
import { toast } from 'sonner';

// Criar instância do Axios
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request - Adiciona token JWT
api.interceptors.request.use(
  (config) => {
    // Buscar token do localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Adicionar token no header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response - Trata erros de autenticação
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Token inválido ou expirado
      if (status === 401 || status === 403) {
        const errorCode = data?.code;
        
        if (errorCode === 'TOKEN_MISSING' || errorCode === 'TOKEN_INVALID') {
          // Limpar token inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Mostrar mensagem
          toast.error('Sessão expirada. Faça login novamente.');
          
          // Redirecionar para login
          window.location.href = '/login';
        } else if (errorCode === 'USER_NOT_FOUND' || errorCode === 'USER_INACTIVE') {
          // Usuário não encontrado ou inativo
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          toast.error(data.error || 'Usuário inválido');
          window.location.href = '/login';
        }
      }
      
      // Erro de servidor (500+)
      if (status >= 500) {
        toast.error('Erro no servidor. Tente novamente mais tarde.');
      }
    } else if (error.request) {
      // Requisição foi feita mas não houve resposta
      toast.error('Sem resposta do servidor. Verifique sua conexão.');
    } else {
      // Erro ao configurar a requisição
      toast.error('Erro ao fazer requisição.');
    }
    
    return Promise.reject(error);
  }
);

export default api;
