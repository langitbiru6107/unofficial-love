import { graphql, PageProps } from "gatsby";
import React from "react";
import { PageUpdateQuery } from "../../types/gatsby-graphql";
import Layout from "../components/Layout";
import Pagination from "../components/Pagination";
import PostItem from "../components/PostItem";
import SEO from "../components/SEO";

type PageContext = {
  title: string;
  slug: string;
  page: number;
  numPages: number;
};

const PageUpdateTemplate: React.FC<PageProps<PageUpdateQuery, PageContext>> = ({
  data,
  pageContext
}) => {
  const posts = data.posts.nodes;
  const { title, ...paginationContext } = pageContext;

  return (
    <Layout>
      <SEO title={title} />
      <PostItem title={`All ${title} Updates`} posts={posts} />
      {paginationContext.numPages > 1 && <Pagination {...paginationContext} />}
    </Layout>
  );
};

export default PageUpdateTemplate;

export const pageQuery = graphql`
  query PageUpdate(
    $skip: Int
    $limit: Int
    $type: String
    $sort: MarkdownRemarkFieldsEnum
  ) {
    posts: allMarkdownRemark(
      sort: { fields: [$sort], order: DESC }
      filter: { frontmatter: { type: { eq: $type } } }
      skip: $skip
      limit: $limit
    ) {
      nodes {
        fields {
          slug
        }
        frontmatter {
          title
          description
          date(formatString: "MMMM DD, YYYY")
          chapter
        }
      }
    }
  }
`;
