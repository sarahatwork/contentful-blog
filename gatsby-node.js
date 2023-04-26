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

// exports.createSchemaCustomization = ({ actions }) => {
//   const { createTypes } = actions

//   createTypes(`
//     type MyContentfulEntry implements Node {
//       testFieldName: String!
//     }
//   `)
// }
//   actions.createFieldExtension({
//     name: 'fieldItems',
//     // args: {
//     //   sanitize: {
//     //     type: 'Boolean!',
//     //     defaultValue: true,
//     //   },
//     // },
//     // The extension `args` (above) are passed to `extend` as
//     // the first argument (`options` below)
//     extend(options, prevFieldConfig) {
//       console.log('=====hello', prevFieldConfig)
//       return {
//         // args: {
//         //   sanitize: 'Boolean',
//         // },
//         resolve(source, args, context, info) {
//           const fieldValue = context.defaultFieldResolver(
//             source,
//             args,
//             context,
//             info
//           )
//           console.log('=====', fieldValue)
//           return fieldValue
//         },
//       }
//     },
//   })
// }

exports.createSchemaCustomization = ({ actions, intermediateSchema }) => {
  const { createTypes } = actions

  createTypes(`
    type RepeaterEntryText implements Node {
      text: String!
    }

    type RepeaterEntryMedia implements Node {
      media: ContentfulAsset!
    }

    union RepeaterEntry = RepeaterEntryText | RepeaterEntryMedia

    type ContentfulRepeaterV2TestingJsonNode {
      entries: [RepeaterEntry!]!
    }
  `)
}

exports.createResolvers = ({ createResolvers, intermediateSchema }) => {
  const typeMap = intermediateSchema.getTypeMap()
  const jsonNodeTypes = intermediateSchema
    .getPossibleTypes(typeMap.Node)
    .map((t) => t.name)
    .filter((name) => name.endsWith('JsonNode'))
  // console.log(jsonNodeTypes)
  createResolvers({
    // Query: {
    //   contentfulBlogPostEnhanced: {
    //     type: '',
    //   },
    // },
    contentfulRepeaterV2TestingJsonNode: {
      // ContentfulRepeaterV2: {
      entries: {
        type: '[RepeaterEntry!]!',
        resolve(...args) {
          console.log('====args', args)
          return [
            {
              __typename: 'RepeaterEntryText',
              text: 'hello',
              internal: {
                type: 'RepeaterEntryText',
              },
            },
          ]
        },
      },
    },
  })
}
