const pool = require("../db/index.js");

//Get Meta (Select)
const getReviewMetaData = async (id) => {
  try {
    let ratingQuery =
      "select json_build_object (rating, count(rating)) as ratingsSum from reviews where product_id = $1 group by rating";

    let recommendedQuery =
      "select json_build_object (recommend, count(recommend)) as recommendsSum from reviews where product_id = $1 group by recommend";

    let characteristicsQuery =
      "select json_build_object (characteristics.name, json_build_object ('id', characteristics.id, 'value', AVG(characteristicreviews.value))) as characteristicsObjs from characteristics inner join characteristicreviews on characteristics.id = characteristicreviews.characteristic_id where characteristics.product_id = $1 group by characteristics.id";

    let metaReviewObj = {
      product_id: id,
      ratings: [],
      recommended: [],
      characteristics: [],
    };
    const metaReviewData = await Promise.all([
      pool.query(ratingQuery, [id]),
      pool.query(recommendedQuery, [id]),
      pool.query(characteristicsQuery, [id]),
    ]);
    console.log("meta", metaReviewData);
    metaReviewData[0].rows.forEach((ratingSum) => {
      metaReviewObj.ratings.push(ratingSum.ratingssum);
    });
    metaReviewData[1].rows.forEach((recommendedRating) => {
      metaReviewObj.recommended.push(recommendedRating.recommendssum);
    });
    metaReviewData[2].rows.forEach((characteristicsObjs) => [
      metaReviewObj.characteristics.push(
        characteristicsObjs.characteristicsobjs
      ),
    ]);
    return metaReviewObj;
  } catch (errorGettingMetaData) {
    return errorGettingMetaData;
  }
};

// Sort Reviews (Sort)
const sortReviews = async (id, sort_by, count) => {
  try {
    if (sort_by === "relevant") {
      sort_by = 'rating"';
    }
    if (sort_by === "newest") {
      sort_by = "date_written";
    }
    let sortReviewQuery =
      "select id, product_id, rating, summary, body, recommend, reviewer_name, response, helpfulness, date_written, photosArr from reviews, lateral ( select json_agg ( json_build_object ( 'id', reviewsphotos.id, 'url', reviewsphotos.url )) as photosArr from reviewsphotos where reviewsphotos.review_id = reviews.id ) as photo where reviews.product_id = $1 order by $2 desc limit $3";
    const sortedReviews = await pool.query(sortReviewQuery, [
      id,
      sort_by,
      count,
    ]);

    return sortedReviews.rows;
  } catch (errorGettingReviews) {
    return errorGettingReviews.stack;
  }
};

//  Post A Review (Insert)
const postProductReview = async (reviewValues) => {
  try {
    let postReviewQuery =
      "insert into reviews(product_id, rating, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness, date_written) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, current_timestamp) returning *";
    const successfulReviewPost = await pool.query(
      postReviewQuery,
      reviewValues
    );
    return successfulReviewPost;
  } catch (errorPostingReview) {
    console.log("error", errorPostingReview);
    return errorPostingReview;
  }
};

//  Report A Review (Update)
const reportProductReview = async (id) => {
  try {
    let reportProductReviewQuery =
      "Update reviews set reported=true where id=$1";
    const successfulReport = await pool.query(reportProductReviewQuery, [id]);
    return successfulReport.rows[0];
  } catch (errorReportingReview) {
    return errorReportingReview;
  }
};

module.exports = {
  reportProductReview,
  postProductReview,
  sortReviews,
  getReviewMetaData,
};
