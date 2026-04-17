
function testPricing(pricePerNightStr, nights, cleaningFeeStr) {
    const pricePerNight = Number(pricePerNightStr) || 0;
    const base_price = Number(nights * pricePerNight);
    const cleaning_fee = Number(cleaningFeeStr) || 0;
    const platform_service_fee = Math.round(base_price * 0.1); 
    const tax = Math.round((base_price + cleaning_fee + platform_service_fee) * 0.13); // 13% VAT
    const total = Math.round(base_price + cleaning_fee + platform_service_fee + tax);

    console.log(`Input: Price=${pricePerNightStr}, Nights=${nights}, Cleaning=${cleaningFeeStr}`);
    console.log(`Calculated: Base=${base_price}, Fee=${platform_service_fee}, Tax=${tax}, Total=${total}`);
    
    if (total > 100000 && base_price < 30000) {
        console.error("FAIL: Potential string concatenation detected!");
    } else {
        console.log("SUCCESS: Calculation is numerical.");
    }
}

console.log("Testing Backend Pricing Fix...");
testPricing("3000", 9, "0");
