const path = require(`path`);
const { createFilePath } = require(`gatsby-source-filesystem`);

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions;

  // Define a template for blog post
  const postTemplate = path.resolve(`./src/templates/Post.tsx`);
  const pageUpdateTemplate = path.resolve(`./src/templates/PageUpdate.tsx`);

  // Get all markdown blog posts sorted by date
  const result = await graphql(
    `
      query GatsbyNode {
        allMarkdownRemark(limit: 1000) {
          nodes {
            id
            fields {
              slug
            }
            frontmatter {
              type
              series
            }
          }
        }
      }
    `
  );

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your blog posts`,
      result.errors
    );
    return;
  }

  const posts = result.data.allMarkdownRemark.nodes;

  // Create blog posts pages
  // But only if there's at least one markdown file found at "content/blog" (defined in gatsby-config.js)
  // `context` is available in the template as a prop and as a variable in GraphQL

  if (posts.length <= 0) {
    reporter.warn(`There is no posts.`);
    return;
  }

  posts.forEach((post, index) => {
    const previousPostId = index === 0 ? null : posts[index - 1].id;
    const nextPostId = index === posts.length - 1 ? null : posts[index + 1].id;

    createPage({
      path: post.fields.slug,
      component: postTemplate,
      context: {
        id: post.id,
        previousPostId,
        nextPostId
      }
    });
  });

  const postPerPage = 5;

  const createUpdatePage = (posts, slug, type, sort, title) => {
    const numPages = Math.ceil(posts.length / postPerPage);

    Array.from({ length: numPages }).forEach((_, index) => {
      createPage({
        path: `${slug}/${index === 0 ? "" : `${index + 1}`}`,
        component: pageUpdateTemplate,
        context: {
          limit: postPerPage,
          skip: index * postPerPage,
          type: type,
          sort: sort,
          page: index + 1,
          numPages: numPages,
          title: title,
          slug: slug
        }
      });
    });
  };

  const blogPosts = posts.filter(
    ({ frontmatter: { type } }) => type === "blog"
  );
  createUpdatePage(blogPosts, "blog", "blog", "frontmatter___date", "Blog");

  const unofficialLovePosts = posts.filter(
    ({ frontmatter: { type, series } }) =>
      type === "story" && series === "Unofficial Love"
  );
  createUpdatePage(
    unofficialLovePosts,
    "unofficial-love",
    "story",
    "frontmatter___chapter",
    "Unofficial Love"
  );
};

exports.onCreateNode = ({ node, actions, getNode }) => {
  const { createNodeField } = actions;

  if (node.internal.type === `MarkdownRemark`) {
    const value = createFilePath({ node, getNode });

    createNodeField({
      name: `slug`,
      node,
      value
    });
  }
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;

  // Explicitly define the siteMetadata {} object
  // This way those will always be defined even if removed from gatsby-config.js

  // Also explicitly define the Markdown frontmatter
  // This way the "MarkdownRemark" queries will return `null` even when no
  // blog posts are stored inside "content/blog" instead of returning an error
  createTypes(`
    type SiteSiteMetadata {
      author: Author
      siteUrl: String
      social: Social
    }

    type Author {
      name: String
      summary: String
    }

    type Social {
      twitter: String
    }

    type MarkdownRemark implements Node {
      frontmatter: Frontmatter
      fields: Fields
    }

    type Frontmatter {
      title: String
      description: String
      date: Date @dateformat
    }

    type Fields {
      slug: String
    }
  `);
};
