/**
 * ============================================
 * DATABASE QUERY VALIDATOR
 * ============================================
 * Ensures MongoDB queries are properly formatted
 * Prevents common errors like:
 * - Malformed JSON (extra/missing commas)
 * - Invalid ObjectId references
 * - Improper field names
 * 
 * Usage:
 *   const QueryValidator = require('../../utils/QueryValidator');
 *   const query = QueryValidator.build({ bloodGroup: 'A+', pincode: '110001' });
 */

const mongoose = require('mongoose');
const Logger = require('./Logger');

class QueryValidator {
  /**
   * Validate if string is valid MongoDB ObjectId
   */
  static isValidObjectId(id) {
    try {
      return mongoose.Types.ObjectId.isValid(id);
    } catch (err) {
      return false;
    }
  }

  /**
   * Convert string to ObjectId if valid
   */
  static toObjectId(id) {
    if (typeof id === 'string' && this.isValidObjectId(id)) {
      return new mongoose.Types.ObjectId(id);
    }
    return id;
  }

  /**
   * Build query object safely
   * Prevents common query building errors
   */
  static build(filters = {}) {
    if (!filters || typeof filters !== 'object') {
      Logger.warn('Invalid filters object', { filters });
      return {};
    }

    const query = {};

    for (const [key, value] of Object.entries(filters)) {
      // Skip null or undefined values
      if (value === null || value === undefined) {
        continue;
      }

      // Skip empty strings
      if (typeof value === 'string' && value.trim() === '') {
        continue;
      }

      // Skip 'all' or 'any' (common filter defaults)
      if (value === 'all' || value === 'any') {
        continue;
      }

      // Handle ObjectId fields
      if (key.includes('Id') || key.includes('id')) {
        if (typeof value === 'string') {
          if (this.isValidObjectId(value)) {
            query[key] = this.toObjectId(value);
          } else {
            Logger.warn(`Invalid ObjectId for field: ${key}`, { value });
          }
        } else if (Array.isArray(value)) {
          query[key] = { $in: value.filter(v => this.isValidObjectId(v)).map(v => this.toObjectId(v)) };
        } else {
          query[key] = value;
        }
      } else {
        // Handle regular fields
        query[key] = value;
      }
    }

    Logger.debug('Query built successfully', { query });
    return query;
  }

  /**
   * Build array of conditions for $and operator
   */
  static buildAnd(conditions = []) {
    if (!Array.isArray(conditions)) {
      Logger.warn('buildAnd expects array', { conditions });
      return [];
    }

    const validConditions = [];

    for (const condition of conditions) {
      if (typeof condition === 'object' && Object.keys(condition).length > 0) {
        validConditions.push(condition);
      }
    }

    return validConditions.length > 0 ? validConditions : [];
  }

  /**
   * Build pagination query
   */
  static paginate(page = 1, limit = 10) {
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 per page

    return {
      skip: (pageNum - 1) * limitNum,
      limit: limitNum,
      page: pageNum
    };
  }

  /**
   * Build sort object
   */
  static sort(sortBy = 'createdAt', order = -1) {
    const validOrder = order === 1 || order === -1 ? order : -1;
    return { [sortBy]: validOrder };
  }

  /**
   * Validate projection (fields to include/exclude)
   */
  static project(fields = {}) {
    if (!fields || typeof fields !== 'object') {
      return {};
    }

    const projection = {};
    for (const [key, value] of Object.entries(fields)) {
      // Only allow 0 or 1
      if (value === 0 || value === 1) {
        projection[key] = value;
      }
    }

    return projection;
  }

  /**
   * Build text search query
   */
  static textSearch(searchTerm, fields = ['name', 'email', 'phone']) {
    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim().length === 0) {
      return null;
    }

    const sanitized = searchTerm.trim();
    
    // Case-insensitive regex search
    return {
      $or: fields.map(field => ({
        [field]: {
          $regex: sanitized,
          $options: 'i'
        }
      }))
    };
  }

  /**
   * Build date range query
   */
  static dateRange(field, startDate, endDate) {
    const query = {};

    try {
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start)) {
          query.$gte = start;
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end)) {
          // Set to end of day
          end.setHours(23, 59, 59, 999);
          query.$lte = end;
        }
      }

      if (Object.keys(query).length > 0) {
        return { [field]: query };
      }
    } catch (err) {
      Logger.warn('Invalid date range', { startDate, endDate, error: err.message });
    }

    return null;
  }

  /**
   * Validate update object (prevent accidental overwrites)
   */
  static validateUpdate(updateData) {
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Update data must be an object');
    }

    // Prevent overwriting sensitive fields
    const restrictedFields = ['_id', 'createdAt', 'password', 'fcmToken'];
    const updateKeys = Object.keys(updateData);

    for (const field of restrictedFields) {
      if (updateKeys.includes(field)) {
        Logger.warn(`Attempt to update restricted field: ${field}`);
        delete updateData[field];
      }
    }

    return updateData;
  }

  /**
   * Log query execution details
   */
  static logQuery(collection, operation, query, result = null) {
    const queryStr = JSON.stringify(query).substring(0, 100) + '...';
    Logger.debug(`DB: ${collection}.${operation}`, {
      query: queryStr,
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0)
    });
  }
}

module.exports = QueryValidator;
