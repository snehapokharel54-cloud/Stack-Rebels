
import { Router } from "express";
import { createWishlist, getWishlists, addListingToWishlist, removeListingFromWishlist, shareWishlist, deleteWishlist } from "../controllers/wishlist.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.use(verifyUser);
router.post("/", createWishlist);
router.get("/", getWishlists);
router.post("/:id/listings/:listingId", addListingToWishlist);
router.delete("/:id/listings/:listingId", removeListingFromWishlist);
router.patch("/:id/share", shareWishlist);
router.delete("/:id", deleteWishlist);

export default router;
      