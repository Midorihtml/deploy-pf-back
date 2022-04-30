const { User, Wishlist, Product, Stock } = require("../db");

const router = require("express").Router();

//-----------------------------------------------------------------------------

router.post("/", async (req, res) => {
  try {
    const { user_id, product_id, seller_id } = req.body;

    const user = await User.findOne({
      where: {
        user_id: user_id,
      },
    }).catch((e) => {
      console.log(e);
      return res.status(400).send(e.message);
    });

    if (!user) return res.status(404).send("User not found");

    const product = await Product.findOne({
      where: {
        product_id: product_id,
      },
    }).catch((e) => {
      console.log(e);
      return res.status(400).send(e.message);
    });

    if (!product) return res.status(404).send("Product not found");

    const seller_stock = await Stock.findOne({
      where: {
        user_id: seller_id,
        product_id: product_id,
      },
    }).catch((e) => {
      console.log(e);
      return res.status(400).send(e.message);
    });

    if (!seller_stock) return res.status(404).send("Seller not found");

    user
      .addWishlists(product, {
        through: { product: product, seller_id: seller_id },
      })
      .then((result) => {
        res.status(200).send(result);
      })
      .catch((e) => {
        console.log(e);
        return res.status(400).send(e.message);
      });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e.message);
  }
});

//-----------------------------------------------------------------------------

router.get("/", async (req, res) => {
  const { user_id } = req.query;

  const result = [];

  await User.findOne({
    where: {
      user_id: user_id,
    },
  })
    .then((user) => {
      if (!user) return res.send.status(404).send("User not found ");
      return user.getWishlists();
    })
    .then((user_wishlist) => {
      const product_promises = [];
      user_wishlist.forEach((object) => {
        product_promises.push(
          Product.findOne({
            where: {
              product_id: object.wishlist.product.product_id,
            },
            include: {
              model: User,
              as: "sellers",
              attributes: ["user_id", "name", "rating_as_seller"],
            },
          }).then((product) => {
            return {
              product_data: product,
              seller_id: object.wishlist.seller_id,
            };
          })
        );
      });
      Promise.all(product_promises).then((result_snapshots) => {
        const user_promises = [];
        result_snapshots.forEach((doc) => {
          let toPush = {
            product_id: doc.product_data.product_id,
            name: doc.product_data.name,
            rating: doc.product_data.rating,
            stock: doc.product_data.stock,
            price: doc.product_data.price,
            images: doc.product_data.images,
          };
          doc.product_data.sellers.map((seller) => {
            if (seller.user_id === doc.seller_id) toPush.seller = seller;
          });
          result.push(toPush);
        });
        return res.status(200).send(result);
      });
    })
    .catch((e) => {
      console.log(e);
      return res.status(400).send(e.message);
    });
});

//-----------------------------------------------------------------------------

router.delete("/", async (req, res) => {
  const { user_id, target, seller_id } = req.body;
  console.log(user_id);
  console.log(target);
  console.log(seller_id);
  if (!user_id || !target || !seller_id)
    return res.status(400).send("Error:Missing data in request");
  const user = await User.findOne({
    where: {
      user_id: user_id,
    },
  });

  if (!user) return res.status(400).send("User not found");

  const seller = await User.findOne({
    where: {
      user_id: seller_id,
    },
  });

  if (!seller) return res.status(404).send("Seller not found");

  if (!target) return res.status(400).send("Target not specified");

  if (target === "all") {
    Wishlist.destroy({
      where: {
        user_id: user_id,
      },
    })
      .then(() => {
        return res.status(200).send("User wishlist deleted");
      })
      .catch((e) => {
        console.log(e);
        return res.status(400).send(e.message);
      });
  } else {
    const product = await Product.findOne({
      where: {
        product_id: target,
      },
    });
    if (!product) return res.send.status(404).send("Product not found ");
    Wishlist.destroy({
      where: {
        user_id: user_id,
        product_id: target,
        seller_id: seller_id,
      },
    })
      .then(() => {
        return res
          .status(200)
          .send("Targeted product deleted from user wishlist");
      })
      .catch((e) => {
        console.log(e);
        return res.status(400).send(e.message);
      });
  }
});

//-----------------------------------------------------------------------------

module.exports = router;
