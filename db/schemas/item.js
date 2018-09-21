// eslint-disable-next-line global-require
const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const ItemSchema = new Schema(
  {
    description: String,
    image: String,
    order: Number,
  },
  {
    collection: 'items',
    timestamps: true
  }
);

const ItemModel = mongoose.model('Item', ItemSchema);

ItemSchema.pre('save', function (next) {
  const self = this;
  if (this.order === undefined || this.order === null) {
    ItemModel.find({})
      .sort({ order: -1 })
      .limit(Number(1))
      .then((results) => {
        if (results.length > 0) {
          self.order = results[0].order + 1;
        } else {
          self.order = 0;
        }
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

module.exports = ItemSchema;
