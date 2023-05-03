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

const repeaterFields = []

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  createTypes(`
    type RepeaterPropertyText implements Node {
      text: String!
    }

    type RepeaterPropertyMedia implements Node {
      media: ContentfulAsset!
    }

    type RepeaterPropertyRichText implements Node {
      richTextRaw: String!
      richTextReferences: [ContentfulAsset!]!
    }

    union RepeaterProperty = 
      | RepeaterPropertyText 
      | RepeaterPropertyMedia
      | RepeaterPropertyRichText
  `)
}

exports.createResolvers = async ({ createResolvers, intermediateSchema }) => {
  const typeMap = intermediateSchema.getTypeMap()
  const contentfulEntryTypes = intermediateSchema.getPossibleTypes(
    typeMap.ContentfulEntry
  )
  contentfulEntryTypes.forEach((graphqlType) => {
    Object.values(graphqlType.getFields()).forEach((fieldData) => {
      if (fieldData.type.ofType?.getFields?.()?.repeaterProperties) {
        repeaterFields.push(fieldData.type.ofType.name)
      }
    })
  })

  let contentfulAssets

  const resolvers = repeaterFields.reduce((acc, fieldName) => {
    acc[fieldName] = {
      entryProperties: {
        type: '[RepeaterProperty!]!',
        async resolve({ repeaterProperties }, _args, { nodeModel }) {
          const getContentfulAsset = async (id) => {
            if (!contentfulAssets) {
              contentfulAssets = Array.from(
                (
                  await nodeModel.findAll({
                    type: 'ContentfulAsset',
                  })
                ).entries
              )
            }
            return contentfulAssets.find((a) => a.contentful_id === id)
          }

          const entryProperties = []
          for (const p of repeaterProperties) {
            const { type, data } = p
            const value = JSON.parse(data)
            switch (type) {
              case 'richText':
                const richTextReferences = []

                for (const ref of value.references) {
                  if (ref.type === 'Asset') {
                    const asset = await getContentfulAsset(ref.contentful_id)
                    richTextReferences.push(asset)
                  } else {
                    // todo find entries
                  }
                }

                entryProperties.push({
                  __typename: 'RepeaterPropertyRichText',
                  richTextRaw: data,
                  richTextReferences,
                  internal: {
                    type: 'RepeaterPropertyRichText',
                  },
                })
                break
              case 'text':
                entryProperties.push({
                  __typename: 'RepeaterPropertyText',
                  text: value,
                  internal: {
                    type: 'RepeaterPropertyText',
                  },
                })
                break
              case 'media':
                const media = await getContentfulAsset(value.sys.id)
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
    }
    return acc
  }, {})

  createResolvers(resolvers)
}
