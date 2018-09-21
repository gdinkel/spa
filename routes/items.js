const express = require('express');
const path = require('path');
const multer = require('multer');
const { matchedData } = require('express-validator/filter');
const { check, validationResult } = require('express-validator/check');
const mongoose = require('mongoose');

const upload = multer({ dest: path.join(`${__dirname}/../public/images/`) });

const { Item } = require('../db/schemas');

const router = express.Router();

/** GET items. */
router.get('/items', (req, res, next) => {
  Item.find({})
    .sort({ order: 1 })
    .then((items) => {
      res.json(items);
    })
    .catch((error) => {
      next(error);
    });
});
/** Upload the image and save the file name and description */
router.post(
  '/items',
  upload.single('image'),
  [
    check('description').isLength({ min: 1, max: 300 })
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const reqObj = matchedData(req);
    const item = new Item({
      description: reqObj.description,
      image: req.file.filename,
    });
    item
      .save()
      .then(() => {
        res.json(item);
      })
      .catch(next);
  }
);
/** Upload the image and return the filename */
router.post(
  '/upload',
  upload.single('image'),
  (req, res) => {
    res.json(req.file.filename);
  }
);
/** Update the item file name and description */
router.put('/items/:_id',
  [
    check('description').optional().isLength({ min: 1, max: 300 }),
    check('image').optional().isLength({ min: 1 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const reqObj = matchedData(req);
    Item.findByIdAndUpdate(
      req.params._id,
      reqObj,
      { new: true },
      (err, item) => {
        if (err) return res.status(500).send(err);
        return res.send(item);
      }
    );
  });

router.put('/items',
  [
    check('items').custom((items) => {
      if (!Array.isArray(items)) {
        throw new Error('Items is not an array');
      }
      // eslint-disable-next-line max-len
      const areItemsValid = items.every(item => item && typeof item.order === 'number' && item.order >= 0 && mongoose.Types.ObjectId.isValid(item._id));
      if (!areItemsValid) {
        throw new Error('Items are not valid');
      }
      return true;
    })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    const reqObj = matchedData(req);
    const bulk = Item.collection.initializeUnorderedBulkOp();
    reqObj.items.forEach((element) => {
      bulk.find({ _id: mongoose.Types.ObjectId(element._id) })
        .update({ $set: { order: element.order } });
    });
    bulk.execute((err) => {
      if (err) return res.status(500).send(err);
      return res.status(200).send(reqObj);
    });
  });
/** Delete an item */
router.delete('/items/:_id', (req, res) => {
  Item.findByIdAndRemove(req.params._id, (err, item) => {
    if (err) return res.status(500).send(err);
    const response = {
      message: 'Item successfully deleted',
      id: item._id
    };
    return res.status(200).send(response);
  });
});

module.exports = router;
