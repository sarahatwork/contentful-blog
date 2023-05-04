const path = require('path')

exports.createPages = async ({ graphql, actions, reporter }) => {
  const { createPage } = actions

  // Define a template for blog post
  const blogPost = path.resolve('./src/templates/blog-post.tsx')
  const personTemplate = path.resolve('./src/templates/person.tsx')

  const result = await graphql(
    `
      {
        allContentfulBlogPost {
          nodes {
            title
            slug
          }
        }
        allContentfulPerson {
          nodes {
            name
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
  const persons = result.data.allContentfulPerson.nodes

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

  if (persons.length > 0) {
    persons.forEach((person) => {
      createPage({
        path: `/person/${person.slug}/`,
        component: personTemplate,
        context: {
          slug: person.slug,
        },
      })
    })
  }
}

const repeaterFields = []

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions

  createTypes(`
    type RepeaterFieldText implements Node {
      name: String!
      text: String
    }

    type RepeaterFieldMedia implements Node {
      name: String!
      media: ContentfulAsset
    }

    type RepeaterFieldRichText implements Node {
      name: String!
      richTextRaw: String
      richTextReferences: [ContentfulAsset!]
    }

    type RepeaterFieldBoolean implements Node {
      name: String!
      boolean: Boolean
    }

    union RepeaterField = 
      | RepeaterFieldText 
      | RepeaterFieldMedia
      | RepeaterFieldRichText
      | RepeaterFieldBoolean
  `)
}

const capitalize = (input) => input[0].toUpperCase() + input.slice(1)

exports.createResolvers = async ({ createResolvers, intermediateSchema }) => {
  const typeMap = intermediateSchema.getTypeMap()
  const contentfulEntryTypes = intermediateSchema.getPossibleTypes(
    typeMap.ContentfulEntry
  )
  contentfulEntryTypes.forEach((graphqlType) => {
    Object.values(graphqlType.getFields()).forEach((fieldData) => {
      if (fieldData.type.ofType?.getFields?.()?.repeaterFields) {
        repeaterFields.push(fieldData.type.ofType.name)
      }
    })
  })

  let contentfulAssets

  const resolvers = repeaterFields.reduce((acc, fieldName) => {
    acc[fieldName] = {
      blockFields: {
        type: '[RepeaterField!]!',
        async resolve({ repeaterFields }, _args, { nodeModel }) {
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

          const blockFields = []

          const addRepeaterField = (property, data) => {
            const type = `RepeaterField${capitalize(property.type)}`
            blockFields.push({
              __typename: type,
              internal: {
                type,
              },
              name: property.name,
              ...data,
            })
          }

          for (const p of repeaterFields) {
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

                addRepeaterField(p, {
                  richTextRaw: data,
                  richTextReferences,
                })
                break
              case 'text':
                addRepeaterField(p, {
                  text: value,
                })
                break
              case 'media':
                const media = await getContentfulAsset(value.sys.id)
                addRepeaterField(p, {
                  media,
                })
                break
              case 'boolean':
                addRepeaterField(p, {
                  boolean: value,
                })
                break
            }
          }
          return blockFields
        },
      },
    }
    return acc
  }, {})

  createResolvers(resolvers)
}
