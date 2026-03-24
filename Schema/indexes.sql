-- Properties
CREATE INDEX idx_properties_host_id       ON properties(host_id);
CREATE INDEX idx_properties_city          ON properties(city);
CREATE INDEX idx_properties_country       ON properties(country);
CREATE INDEX idx_properties_available     ON properties(available);
CREATE INDEX idx_properties_price         ON properties(price_per_night);
 
-- Property images
CREATE INDEX idx_property_images_property ON property_images(property_id);
CREATE INDEX idx_property_images_primary  ON property_images(property_id, is_primary);
 
-- Bookings
CREATE INDEX idx_bookings_property_id     ON bookings(property_id);
CREATE INDEX idx_bookings_guest_id        ON bookings(guest_id);
CREATE INDEX idx_bookings_status          ON bookings(status);
CREATE INDEX idx_bookings_check_in        ON bookings(check_in);
CREATE INDEX idx_bookings_check_out       ON bookings(check_out);
 
-- Reviews
CREATE INDEX idx_reviews_property_id      ON reviews(property_id);
CREATE INDEX idx_reviews_reviewer_id      ON reviews(reviewer_id);
 
-- Property amenities
CREATE INDEX idx_property_amenities_amenity ON property_amenities(amenity_id);
 