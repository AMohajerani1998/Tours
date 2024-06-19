class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const filter = { ...this.queryString };
        const filterExcludes = ['fields', 'limit', 'page', 'sort'];
        filterExcludes.forEach((el) => delete filter[el]);
        let filterString = JSON.stringify(filter);
        filterString = filterString.replace(/\b(lt|lte|gt|gte)\b/g, (match) => `$${match}`);
        this.query = this.query.find(JSON.parse(filterString));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const queryStr = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(queryStr);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }

    select() {
        if (this.queryString.fields) {
            const queryStr = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(queryStr);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
module.exports = APIFeatures;
