import { BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Model, Document, FilterQuery, UpdateQuery, ClientSession, SortOrder, PipelineStage } from 'mongoose';
import { EMovieSort } from 'src/common';

/**
 * Generic Repository - An object class that helps manipulate the database in a generic way,
 * supporting CRUD, pagination, transactions, aggregations, batch writes, etc.
 */
export class BaseRepository<T extends Document> {
    constructor(private readonly model: Model<T>) {}

    /**
     * Find a document based on the condition
     * @param query The search condition
     * @param fields The fields to retrieve
     * @param lean Whether to return a pure object or not
     * @returns The document or null if not found
     */
    protected async findDocument<K extends Partial<T> = Partial<T>>(query: FilterQuery<T>, fields: Array<keyof T> = [], lean = true): Promise<K> {
        try {
            const projection = fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {});
            const queryBuilder = this.model.findOne(query).select(projection);
            return lean ? (queryBuilder.lean().exec() as unknown as Promise<K>) : (queryBuilder.exec() as unknown as Promise<K>);
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to find document', error: error.message });
        }
    }

    /**
     * Find multiple paginated documents
     * @param query Search criteria
     * @param limit Maximum number of documents
     * @param last_id `_id` of the last document (if any, used for pagination)
     * @returns List of documents
     */
    protected async findDocuments<K = T>(query: FilterQuery<T>, limit: number, fields: Array<keyof T> = [], sort: Record<string, SortOrder> = {}, lean = true): Promise<K[]> {
        try {
            const projection = fields.reduce((acc, field) => ({ ...acc, [field]: 1 }), {});
            let queryBuilder = this.model.find(query).select(projection);
            if (limit) queryBuilder = queryBuilder.limit(limit);
            if (Object.keys(sort).length > 0) queryBuilder = queryBuilder.sort(sort);
            // @ts-ignore
            if (lean) queryBuilder = queryBuilder.lean();
            return queryBuilder.exec() as Promise<K[]>;
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to find documents', error: error.message });
        }
    }

    /**
     * Count the number of documents according to the condition
     */
    public async countDocuments(query: FilterQuery<T>, session?: ClientSession): Promise<number> {
        try {
            const queryBuilder = this.model.countDocuments(query);
            if (session) queryBuilder.session(session);
            return queryBuilder.exec();
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to count documents', error: error.message });
        }
    }

    protected async countDocumentsByIds(field: keyof T, ids: string[], session?: ClientSession): Promise<Record<string, number>> {
        try {
            const pipeline: any[] = [
                {
                    $match: {
                        [field]: { $in: ids },
                    },
                },
                {
                    $group: {
                        _id: `$${String(field)}`,
                        count: { $sum: 1 },
                    },
                },
            ];

            if (session) {
                // @ts-ignore - aggregate accepts session but TS sometimes doesn't pick it up properly
                pipeline.push({ $session: session });
            }

            const result = await this.model.aggregate(pipeline).exec();

            // Convert array to a record with id => count
            const countMap: Record<string, number> = {};
            for (const item of result) {
                countMap[item._id.toString()] = item.count;
            }

            // Ensure all ids are included with 0 if not present in the result
            for (const id of ids) {
                if (!countMap[id]) countMap[id] = 0;
            }

            return countMap;
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to count documents by ids', error: error.message });
        }
    }

    /**
     * Create a new document
     */
    protected async createDocument(data: Partial<T>, session?: ClientSession): Promise<T> {
        try {
            const document = new this.model(data);
            await document.save({ session });
            return document.toObject() as T; // 👈 convert to plain object
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException({ message: 'Failed to create document', error: error.message });
        }
    }

    /**
     * ✏️ Update a document based on a condition
     */
    protected async updateDocument(query: FilterQuery<T>, updateData: UpdateQuery<T>, session?: ClientSession): Promise<{ matchedCount: number; modifiedCount: number }> {
        try {
            const queryBuilder = this.model.updateOne(query, updateData);
            if (session) queryBuilder.session(session);

            const { matchedCount, modifiedCount } = await queryBuilder.exec();
            return { matchedCount, modifiedCount };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({ message: 'Failed to update document', error: error.message });
        }
    }

    /**
     * Delete a document based on conditions
     */
    protected async deleteDocument(query: FilterQuery<T>, session?: ClientSession): Promise<{ acknowledged: boolean; deletedCount: number }> {
        try {
            const queryBuilder = this.model.deleteOne(query);
            if (session) queryBuilder.session(session);

            const { acknowledged, deletedCount } = await queryBuilder.exec();
            return { acknowledged, deletedCount };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException({ message: 'Failed to delete document', error: error.message });
        }
    }

    /**
     * Find and update, return the latest document
     */
    protected async findOneAndUpdate<K = T>(query: FilterQuery<T>, updateData: UpdateQuery<T>, options: { new: boolean; upsert: boolean }, session?: ClientSession): Promise<K> {
        const queryBuilder = this.model.findOneAndUpdate(query, updateData, { upsert: options.upsert, new: options.new });
        if (session) queryBuilder.session(session);
        return queryBuilder.exec() as Promise<K>;
    }

    /**
     * Find and delete, return deleted documents
     */
    protected async findOneAndDelete<K = T>(query: FilterQuery<T>, session?: ClientSession): Promise<K> {
        const queryBuilder = this.model.findOneAndDelete(query);
        if (session) queryBuilder.session(session);
        return queryBuilder.exec() as Promise<K>;
    }

    /**
     * Bulk Write - perform multiple insert/update/delete operations at once
     */
    protected async bulkWrite(operations: any[], session?: ClientSession): Promise<any> {
        try {
            return await this.model.bulkWrite(operations, session ? { session } : {});
        } catch (error) {
            if (error.code) throw new InternalServerErrorException({ message: 'Bulk write failed', error: error.message });
            throw new InternalServerErrorException({ message: 'Unexpected error during bulk write', error: error.message });
        }
    }

    /**
     * Aggregation pipeline (e.g. data aggregation, statistics)
     */
    public async aggregate<K = T>(pipeline: PipelineStage[], session?: ClientSession): Promise<K[]> {
        try {
            const queryBuilder = this.model.aggregate(pipeline);
            if (session) queryBuilder.session(session);
            return queryBuilder.exec() as Promise<K[]>;
        } catch (error) {
            throw new InternalServerErrorException({ message: 'Failed to execute aggregation', error: error.message });
        }
    }

    /**
     * Transaction - perform multiple related operations in the same transaction session
     */
    public async transaction<R>(fn: (session: ClientSession) => Promise<R>): Promise<R> {
        const session = await this.model.startSession();
        session.startTransaction();
        try {
            const result = await fn(session);
            await session.commitTransaction();
            return result;
        } catch (error) {
            await session.abortTransaction();
            throw new InternalServerErrorException({ message: 'Transaction failed, please try again later.', error: error.message });
        } finally {
            session.endSession();
        }
    }
}
