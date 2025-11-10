import { Router } from 'express';
import { db } from '../db';
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

    const result = db.prepare(`
      INSERT INTO tickets (user_id, title, description, category, priority, status)
      VALUES (?, ?, ?, ?, ?, 'open')
    `).run(userId, title, description, category, priority);

    const ticketId = result.lastInsertRowid;

    // Adicionar mensagem inicial do usuário
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_type, message)
      VALUES (?, 'user', ?)
    `).run(ticketId, description);

    // Gerar resposta automática da Mia
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Você é Mia, assistente de suporte 24/7 do MarketHub CRM.
        
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
        db.prepare(`
          INSERT INTO ticket_messages (ticket_id, sender_type, message)
          VALUES (?, 'mia', ?)
        `).run(ticketId, miaResponse);

        // Atualizar status para in_progress
        db.prepare(`
          UPDATE tickets SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(ticketId);

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

    let query = 'SELECT * FROM tickets WHERE user_id = ?';
    const params: any[] = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const tickets = db.prepare(query).all(...params);
    res.json(tickets);
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

    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    const messages = db.prepare(`
      SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC
    `).all(id);

    res.json({ ticket, messages });
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
    const ticket = db.prepare(`
      SELECT * FROM tickets WHERE id = ? AND user_id = ?
    `).get(id, userId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Adicionar mensagem do usuário
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_type, message)
      VALUES (?, 'user', ?)
    `).run(id, message);

    // Atualizar timestamp do ticket
    db.prepare(`
      UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    // Gerar resposta da Mia
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // Buscar histórico de mensagens
        const history = db.prepare(`
          SELECT sender_type, message FROM ticket_messages 
          WHERE ticket_id = ? 
          ORDER BY created_at ASC
        `).all(id) as Array<{ sender_type: string; message: string }>;

        const conversationHistory = history.map(msg => 
          `${msg.sender_type === 'user' ? 'Usuário' : 'Mia'}: ${msg.message}`
        ).join('\n\n');

        const prompt = `Você é Mia, assistente de suporte 24/7 do MarketHub CRM.

Ticket: ${(ticket as any).title}
Categoria: ${(ticket as any).category}

Histórico da conversa:
${conversationHistory}

Responda à última mensagem do usuário de forma útil e profissional. Se o problema foi resolvido, pergunte se pode fechar o ticket.

Resposta:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const miaResponse = response.text();

        // Salvar resposta da Mia
        db.prepare(`
          INSERT INTO ticket_messages (ticket_id, sender_type, message)
          VALUES (?, 'mia', ?)
        `).run(id, miaResponse);

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

    const result = db.prepare(`
      UPDATE tickets 
      SET status = 'closed', resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(id, userId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao fechar ticket:', error);
    res.status(500).json({ error: 'Erro ao fechar ticket' });
  }
});

export default router;
