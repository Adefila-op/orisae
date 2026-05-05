import { db } from '../server'
import { v4 as uuidv4 } from 'uuid'

export interface SmartLink {
  id: string
  creator_id: string
  product_id?: string
  code: string
  short_url?: string
  target_url: string
  original_url?: string
  platform?: string
  offer_type: string
  offer_value: number
  enabled: boolean
  click_count: number
  conversion_count: number
  total_value: number
}

export class LinkService {
  async createLink(
    creator_id: string,
    target_url: string,
    product_id?: string,
    offer_type: string = 'recovery',
    offer_value: number = 10,
    original_url?: string,
    platform?: string
  ): Promise<SmartLink> {
    const code = this.generateCode()
    const id = uuidv4()
    const short_url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/l/${code}`
    
    try {
      const result = await db.query(
        `INSERT INTO smart_links (
          id, creator_id, product_id, code, short_url, target_url, 
          original_url, platform, offer_type, offer_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id,
          creator_id,
          product_id || null,
          code,
          short_url,
          target_url,
          original_url || null,
          platform || 'custom',
          offer_type,
          offer_value,
        ]
      )
      
      return result.rows[0]
    } catch (error) {
      console.error('Error creating link:', error)
      throw error
    }
  }

  async getLink(code: string): Promise<SmartLink | null> {
    try {
      const result = await db.query(
        'SELECT * FROM smart_links WHERE code = $1',
        [code]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error getting link:', error)
      throw error
    }
  }

  async getLinkById(id: string): Promise<SmartLink | null> {
    try {
      const result = await db.query(
        'SELECT * FROM smart_links WHERE id = $1',
        [id]
      )
      return result.rows[0] || null
    } catch (error) {
      console.error('Error getting link by id:', error)
      throw error
    }
  }

  async getCreatorLinks(creator_id: string): Promise<SmartLink[]> {
    const result = await db.query(
      `SELECT * FROM smart_links 
       WHERE creator_id = $1 
       ORDER BY created_at DESC`,
      [creator_id]
    )
    return result.rows
  }

  async updateLinkStats(
    link_id: string,
    type: 'click' | 'conversion',
    value?: number
  ): Promise<void> {
    if (type === 'click') {
      await db.query(
        'UPDATE smart_links SET click_count = click_count + 1 WHERE id = $1',
        [link_id]
      )
    } else if (type === 'conversion') {
      await db.query(
        `UPDATE smart_links 
         SET conversion_count = conversion_count + 1, 
             total_value = total_value + $1
         WHERE id = $2`,
        [value || 0, link_id]
      )
    }
  }

  async deleteLink(link_id: string, creator_id: string): Promise<boolean> {
    const result = await db.query(
      'DELETE FROM smart_links WHERE id = $1 AND creator_id = $2',
      [link_id, creator_id]
    )
    return result.rowCount > 0
  }

  async toggleLink(link_id: string, enabled: boolean): Promise<SmartLink | null> {
    const result = await db.query(
      'UPDATE smart_links SET enabled = $1 WHERE id = $2 RETURNING *',
      [enabled, link_id]
    )
    return result.rows[0] || null
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }
}

export default new LinkService()
