import pg from 'pg';
const pool = new pg.Pool({ user: 'piyushrauniyar', host: 'localhost', database: 'grihastha', port: 5432 });
pool.query(`SELECT l.*, u.full_name as host_name, u.avatar_url as host_avatar,
                      COALESCE(AVG(r.overall_rating), 0) as average_rating,
                      COUNT(r.id) as review_count
               FROM listings l
               JOIN users u ON l.host_id = u.id
               LEFT JOIN reviews r ON l.id = r.listing_id
               WHERE l.status = 'PUBLISHED' GROUP BY l.id, u.full_name, u.avatar_url ORDER BY l.created_at DESC LIMIT 4 OFFSET 0`).then(res => { console.log('SUCCESS'); pool.end(); }).catch(e => { console.error('ERROR:', e.message); pool.end(); });
