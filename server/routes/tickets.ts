import { Router } from 'express';
import { query } from '../db';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

// Criar novo ticket
router.post('/', async (req, res) => {
  try {
    const { title, description, category, priority = 'medium' } = req.body;
    const userId = (req as any).user?.id || 1; // TODO: pegar do auth real

    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Título, descrição e categoria são obrigatórios' });
    }

    const result = await query(`
      INSERT INTO tickets (user_id, title, description, category, priority, status)
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING id
    `, [userId, title, description, category, priority]);

    const ticketId = result.rows[0].id;

    // Adicionar mensagem inicial do usuário
    await query(`
      INSERT INTO ticket_messages (ticket_id, sender_type, message)
      VALUES ($1, 'user', $2)
    `, [ticketId, description]);

    // Gerar resposta automática da Mia
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Você é Mia, assistente de suporte 24/7 do Markthub CRM.
        
Um usuário abriu um ticket de suporte:
Categoria: ${category}
Prioridade: ${priority}
Título: ${title}
Descrição: ${description}

Responda de forma profissional, empática e útil:
1. Confirme que recebeu o chamado
2. Dê uma estimativa de tempo de resolução
3. Se possível, forneça uma solução imediata ou próximos passos
4. Seja concisa e objetiva

Resposta:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const miaResponse = response.text();

        // Salvar resposta da Mia
        await query(`
          INSERT INTO ticket_messages (ticket_id, sender_type, message)
          VALUES ($1, 'mia', $2)
        `, [ticketId, miaResponse]);

        // Atualizar status para in_progress
        await query(`
          UPDATE tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [ticketId]);

        res.json({
          ticket: {
            id: ticketId,
            title,
            description,
            category,
            priority,
            status: 'in_progress'
          },
          miaResponse
        });
      } catch (error) {
        console.error('Erro ao gerar resposta da Mia:', error);
        res.json({
          ticket: {
            id: ticketId,
            title,
            description,
            category,
            priority,
            status: 'open'
          }
        });
      }
    } else {
      res.json({
        ticket: {
          id: ticketId,
          title,
          description,
          category,
          priority,
          status: 'open'
        }
      });
    }
  } catch (error: any) {
    console.error('Erro ao criar ticket:', error);
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
});

// Listar tickets do usuário
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 1;
    const { status } = req.query;

    let queryText = 'SELECT * FROM tickets WHERE user_id = $1';
    const params: any[] = [userId];

    if (status) {
      queryText += ' AND status = $2';
      params.push(status);
    }

    queryText += ' ORDER BY created_at DESC';

    const result = await query(queryText, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar tickets:', error);
    res.status(500).json({ error: 'Erro ao listar tickets' });
  }
});

// Obter detalhes do ticket com mensagens
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 1;

    const ticketResult = await query(`
      SELECT * FROM tickets WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const messagesResult = await query(`
      SELECT * FROM ticket_messages WHERE ticket_id = $1 ORDER BY created_at ASC
    `, [id]);

    res.json({ ticket: ticketResult.rows[0], messages: messagesResult.rows });
  } catch (error) {
    console.error('Erro ao obter ticket:', error);
    res.status(500).json({ error: 'Erro ao obter ticket' });
  }
});

// Adicionar mensagem ao ticket
router.post('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = (req as any).user?.id || 1;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Verificar se ticket existe e pertence ao usuário
    const ticketResult = await query(`
      SELECT * FROM tickets WHERE id = $1 AND user_id = $2
    `, [id, userId]);

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const ticket = ticketResult.rows[0];

    // Adicionar mensagem do usuário
    await query(`
      INSERT INTO ticket_messages (ticket_id, sender_type, message)
      VALUES ($1, 'user', $2)
    `, [id, message]);

    // Atualizar timestamp do ticket
    await query(`
      UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
    `, [id]);

    // Gerar resposta da Mia
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Buscar histórico de mensagens
        const historyResult = await query(`
          SELECT sender_type, message FROM ticket_messages 
          WHERE ticket_id = $1 
          ORDER BY created_at ASC
        `, [id]);

        const conversationHistory = historyResult.rows.map((msg: any) => 
          `${msg.sender_type === 'user' ? 'Usuário' : 'Mia'}: ${msg.message}`
        ).join('\n\n');

        const prompt = `Você é Mia, assistente de suporte 24/7 do Markthub CRM.

Ticket: ${ticket.title}
Categoria: ${ticket.category}

Histórico da conversa:
${conversationHistory}

Responda à última mensagem do usuário de forma útil e profissional. Se o problema foi resolvido, pergunte se pode fechar o ticket.

Resposta:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const miaResponse = response.text();

        // Salvar resposta da Mia
        await query(`
          INSERT INTO ticket_messages (ticket_id, sender_type, message)
          VALUES ($1, 'mia', $2)
        `, [id, miaResponse]);

        res.json({ success: true, miaResponse });
      } catch (error) {
        console.error('Erro ao gerar resposta da Mia:', error);
        res.json({ success: true });
      }
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    console.error('Erro ao adicionar mensagem:', error);
    res.status(500).json({ error: 'Erro ao adicionar mensagem' });
  }
});

// Fechar ticket
router.patch('/:id/close', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 1;

    const result = await query(`
      UPDATE tickets 
      SET status = 'closed', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao fechar ticket:', error);
    res.status(500).json({ error: 'Erro ao fechar ticket' });
  }
});

export default router;
