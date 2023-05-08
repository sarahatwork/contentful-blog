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

const repeaterBlocks = []

exports.createResolvers = async ({ createResolvers, intermediateSchema }) => {
  const typeMap = intermediateSchema.getTypeMap()
  const contentfulEntryTypes = intermediateSchema.getPossibleTypes(
    typeMap.ContentfulEntry
  )
  contentfulEntryTypes.forEach((graphqlType) => {
    Object.values(graphqlType.getFields()).forEach((fieldData) => {
      if (fieldData.type.ofType?.getFields?.()?.data__REPEATER) {
        repeaterBlocks.push(fieldData.type.ofType.name)
      }
    })
  })

  let contentfulAssets
  let contentfulEntries

  const resolvers = repeaterBlocks.reduce((acc, fieldName) => {
    acc[fieldName] = {
      raw: {
        type: 'String!',
        async resolve({ data__REPEATER }) {
          return JSON.stringify(data__REPEATER)
        },
      },
      references: {
        type: '[ContentfulReference!]!',
        async resolve({ data__REPEATER }, _args, { nodeModel }) {
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

          const getContentfulEntry = async (id) => {
            if (!contentfulEntries) {
              contentfulEntries = Array.from(
                (
                  await nodeModel.findAll({
                    type: 'ContentfulEntry',
                  })
                ).entries
              )
            }
            return contentfulEntries.find((a) => a.contentful_id === id)
          }

          const references = []

          for (const field of Object.values(data__REPEATER)) {
            const { type, data } = field

            switch (type) {
              case 'richText':
                for (const ref of data.references) {
                  if (ref.type === 'Asset') {
                    const asset = await getContentfulAsset(ref.contentful_id)
                    references.push(asset)
                  } else {
                    // Linked entries are not currently implemented
                  }
                }
                break
              case 'mediaSingle':
                if (data?.sys?.id) {
                  const asset = await getContentfulAsset(data.sys.id)
                  references.push(asset)
                }
                break
              case 'mediaMultiple':
                if (!data) break
                for (const ref of data) {
                  if (ref?.sys?.id) {
                    const asset = await getContentfulAsset(ref.sys.id)
                    references.push(asset)
                  }
                }
                break
              case 'referenceSingle':
                if (data?.sys?.id) {
                  const entry = await getContentfulEntry(data.sys.id)
                  references.push(entry)
                }
                break
              case 'referenceMultiple':
                if (!data) break
                for (const ref of data) {
                  if (ref?.sys?.id) {
                    const entry = await getContentfulEntry(ref.sys.id)
                    references.push(entry)
                  }
                }
                break
            }
          }

          return references
        },
      },
    }
    return acc
  }, {})

  createResolvers(resolvers)
}
