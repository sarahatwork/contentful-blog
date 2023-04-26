const path = require('path')

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Define a template for blog post
  const blogPost = path.resolve('./src/templates/blog-post.tsx')

  const result = await graphql(
    `
      {
        allContentfulBlogPost {
          nodes {
            title
            slug
          }
        }
      }
    `
  )

  if (result.errors) {
    reporter.panicOnBuild(
      `There was an error loading your Contentful posts`,
      result.errors
    )
    return
  }

  const posts = result.data.allContentfulBlogPost.nodes

  // Create blog posts pages
  // But only if there's at least one blog post found in Contentful
  // `context` is available in the template as a prop and as a variable in GraphQL

  if (posts.length > 0) {
    posts.forEach((post, index) => {
      const previousPostSlug = index === 0 ? null : posts[index - 1].slug
      const nextPostSlug =
        index === posts.length - 1 ? null : posts[index + 1].slug

      createPage({
        path: `/blog/${post.slug}/`,
        component: blogPost,
        context: {
          slug: post.slug,
          previousPostSlug,
          nextPostSlug,
        },
      })
    })
  }
}

exports.createSchemaCustomization = ({ actions, intermediateSchema }) => {
  const { createTypes } = actions

  createTypes(`
    type RepeaterPropertyText implements Node {
      text: String!
    }

    type RepeaterPropertyMedia implements Node {
      media: ContentfulAsset!
    }

    union RepeaterProperty = RepeaterPropertyText | RepeaterPropertyMedia

    # this is temporary
    type ContentfulRepeaterV2TestingJsonNode {
      entryProperties: [RepeaterProperty!]!
    }
  `)
}

exports.createResolvers = async ({
  createResolvers,
  intermediateSchema,
  getNode,
  ...props
}) => {
  const typeMap = intermediateSchema.getTypeMap()
  const contentfulEntryTypes = intermediateSchema.getPossibleTypes(
    typeMap.ContentfulEntry
  )
  const entriesWithJsonFields = []
  contentfulEntryTypes.forEach((graphqlType) => {
    const fields = []
    Object.values(graphqlType.getFields()).forEach((fieldData) => {
      if (fieldData.type.ofType?.name?.endsWith('JsonNode')) {
        fields.push(fieldData)
      }
    })

    if (fields.length) {
      entriesWithJsonFields.push({
        name: graphqlType.name,
        fields,
      })
    }
  })

  const entryType = entriesWithJsonFields[1] // temp

  let contentfulAssets

  createResolvers({
    contentfulRepeaterV2TestingJsonNode: {
      entryProperties: {
        type: '[RepeaterProperty!]!',
        async resolve({ properties }, _args, { nodeModel }) {
          const entryProperties = []
          for (const p of properties) {
            switch (p.type) {
              case 'text':
                entryProperties.push({
                  __typename: 'RepeaterPropertyText',
                  text: p.value,
                  internal: {
                    type: 'RepeaterPropertyText',
                  },
                })
                break
              case 'media':
                if (!contentfulAssets) {
                  contentfulAssets = Array.from(
                    (
                      await nodeModel.findAll({
                        type: 'ContentfulAsset',
                      })
                    ).entries
                  )
                }
                const media = contentfulAssets.find(
                  (a) => a.contentful_id === p.value.sys.id
                )
                entryProperties.push({
                  __typename: 'RepeaterPropertyMedia',
                  media,
                  internal: {
                    type: 'RepeaterPropertyMedia',
                  },
                })
                break
            }
          }
          return entryProperties
        },
      },
    },
  })
}
