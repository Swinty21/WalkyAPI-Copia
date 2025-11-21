const db = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
    }

    async findAll(conditions = '', params = []) {
        try {
            let sql = `SELECT * FROM ${this.tableName}`;
            if (conditions) {
                sql += ` WHERE ${conditions}`;
            }
            return await db.query(sql, params);
        } catch (error) {
            throw new ApiError(`Error al obtener registros de ${this.tableName}`, 500);
        }
    }

    async findById(id) {
        try {
            const sql = `SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`;
            const results = await db.query(sql, [id]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            throw new ApiError(`Error al buscar registro en ${this.tableName}`, 500);
        }
    }

    async create(data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const placeholders = fields.map(() => '?').join(', ');
            
            const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
            const result = await db.query(sql, values);
            
            return this.findById(result.insertId);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new ApiError('El registro ya existe', 400);
            }
            throw new ApiError(`Error al crear registro en ${this.tableName}`, 500);
        }
    }

    async update(id, data) {
        try {
            const fields = Object.keys(data);
            const values = Object.values(data);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            
            const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`;
            await db.query(sql, [...values, id]);
            
            return this.findById(id);
        } catch (error) {
            throw new ApiError(`Error al actualizar registro en ${this.tableName}`, 500);
        }
    }

    async delete(id) {
        try {
            const sql = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await db.query(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new ApiError(`Error al eliminar registro de ${this.tableName}`, 500);
        }
    }

    async count(conditions = '', params = []) {
        try {
            let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
            if (conditions) {
                sql += ` WHERE ${conditions}`;
            }
            const result = await db.query(sql, params);
            return result[0].total;
        } catch (error) {
            throw new ApiError(`Error al contar registros en ${this.tableName}`, 500);
        }
    }
}

module.exports = BaseModel;