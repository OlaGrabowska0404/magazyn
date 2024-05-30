const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

// GET all products with filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { sort, filter, ...query } = req.query;

    // Build sort options
    let sortOptions = {};
    if (sort) {
      const sortFields = sort.split(',').map(field => {
        if (field.startsWith('-')) {
          return [field.substring(1), -1];
        } else {
          return [field, 1];
        }
      });
      sortOptions = Object.fromEntries(sortFields);
    }

    // Handle filtering
    let filterOptions = {};
    if (filter) {
      const filterFields = filter.split(',').map(field => {
        const [key, value] = field.split(':');
        filterOptions[key] = value;
      });
      Object.assign(query, filterOptions);
    }

    const products = await Product.find(query).sort(sortOptions);
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a new product
router.post('/', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a product by ID
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a product by ID
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET inventory report
router.get('/report', async (req, res) => {
  try {
    const report = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$price"] } }
        }
      }
    ]);

    res.status(200).json(report[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
