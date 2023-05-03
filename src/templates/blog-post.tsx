import React, { Fragment } from 'react'
import { Link, PageProps, graphql } from 'gatsby'
import get from 'lodash/get'
import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer'
import { BLOCKS } from '@contentful/rich-text-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'

import Seo from '../components/seo'
import Layout from '../components/layout'
import Hero from '../components/hero'
import Tags from '../components/tags'
// @ts-ignore
import * as styles from './blog-post.module.css'

class BlogPostTemplate extends React.Component<
  PageProps<Queries.BlogPostBySlugQuery>
> {
  render() {
    const post = get(this.props, 'data.contentfulBlogPost')
    if (!post) return null

    const previous = get(this.props, 'data.previous')
    const next = get(this.props, 'data.next')
    const plainTextDescription = post?.description?.raw
      ? documentToPlainTextString(JSON.parse(post.description.raw))
      : undefined
    console.log(this.props.data)

    const options = {
      renderNode: {
        [BLOCKS.EMBEDDED_ASSET]: (node) => {
          console.log('=====node', node)
          const { gatsbyImage, description } = node.data.target
          return (
            <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
          )
        },
      },
    }

    return (
      <Layout location={this.props.location}>
        <Seo
          title={post.title}
          description={plainTextDescription}
          image={`http:${post.heroImage?.resize?.src}`}
        />
        <Hero
          image={post.heroImage?.gatsbyImage}
          title={post.title}
          content={post.description}
        />
        <div className={styles.container}>
          <span className={styles.meta}>
            {post.author?.name} &middot;{' '}
            <time dateTime={post.rawDate!}>{post.publishDate}</time>
          </span>
          <div className={styles.article}>
            <div className={styles.body}>
              {post.modules?.map((m, i) => {
                switch (m?.__typename) {
                  case 'ContentfulTextBlock':
                    return (
                      <Fragment key={i}>
                        <h2>{m.title}</h2>
                        {/* @ts-ignore */}
                        {m.body?.raw ? renderRichText(m.body, options) : null}
                      </Fragment>
                    )
                  case 'ContentfulImageBlock':
                    return (
                      <Fragment key={i}>
                        <h2>{m.title}</h2>
                        {m.image?.gatsbyImage && (
                          <GatsbyImage
                            alt={m.title!}
                            image={m.image?.gatsbyImage}
                          />
                        )}
                      </Fragment>
                    )
                  case 'ContentfulRepeater':
                    return (
                      <Fragment key={i}>
                        <h2>{m.title}</h2>
                        {m.entries?.map((e, i) => (
                          <div key={i}>
                            <strong>{e?.key}:</strong> {e?.value}
                          </div>
                        ))}
                      </Fragment>
                    )
                  case 'ContentfulRepeaterV2':
                    return (
                      <Fragment key={i}>
                        <h2>{m.title}</h2>
                        {m.testing?.map((entry, i) => {
                          return (
                            <div key={i}>
                              <h1>Entry {i + 1}</h1>
                              {entry?.entryProperties.map((property, j) => {
                                switch (property.__typename) {
                                  case 'RepeaterPropertyText':
                                    return <p key={j}>{property.text}</p>
                                  case 'RepeaterPropertyRichText':
                                    return (
                                      <p key={j}>
                                        {renderRichText(
                                          {
                                            raw: property.richTextRaw,
                                            // @ts-ignore
                                            references:
                                              property.richTextReferences,
                                          },
                                          options
                                        )}
                                      </p>
                                    )
                                  case 'RepeaterPropertyMedia':
                                    return (
                                      <GatsbyImage
                                        key={j}
                                        alt={'Missing alt'}
                                        image={property.media.gatsbyImage!}
                                      />
                                    )
                                }
                              })}
                            </div>
                          )
                        })}
                        <h3>Field 2</h3>
                        {m.testingMedia?.map((entry, i) => {
                          return (
                            <div key={i}>
                              <h1>Entry {i + 1}</h1>
                              {entry?.entryProperties.map((property, j) => {
                                switch (property.__typename) {
                                  case 'RepeaterPropertyText':
                                    return <p key={j}>{property.text}</p>

                                  case 'RepeaterPropertyMedia':
                                    return (
                                      <GatsbyImage
                                        key={j}
                                        alt={'Missing alt'}
                                        image={property.media.gatsbyImage!}
                                      />
                                    )
                                }
                              })}
                            </div>
                          )
                        })}
                        <h3>Field 3</h3>
                        {m.richText?.map((entry, i) => {
                          return (
                            <div key={i}>
                              <h1>Entry {i + 1}</h1>
                              {entry?.entryProperties.map((property, j) => {
                                switch (property.__typename) {
                                  case 'RepeaterPropertyRichText':
                                    return (
                                      <p key={j}>
                                        {renderRichText(
                                          {
                                            raw: property.richTextRaw,
                                            // @ts-ignore
                                            references:
                                              property.richTextReferences,
                                          },
                                          options
                                        )}
                                      </p>
                                    )
                                }
                              })}
                            </div>
                          )
                        })}
                      </Fragment>
                    )
                  default:
                    return null
                }
              })}
            </div>
            <Tags tags={post.tags} />
            {(previous || next) && (
              <nav>
                <ul className={styles.articleNavigation}>
                  {previous && (
                    <li>
                      <Link to={`/blog/${previous.slug}`} rel="prev">
                        ← {previous.title}
                      </Link>
                    </li>
                  )}
                  {next && (
                    <li>
                      <Link to={`/blog/${next.slug}`} rel="next">
                        {next.title} →
                      </Link>
                    </li>
                  )}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </Layout>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  fragment Repeater on RepeaterProperty {
    __typename
    ... on RepeaterPropertyText {
      text
    }
    ... on RepeaterPropertyRichText {
      richTextRaw
      richTextReferences {
        __typename
        ... on ContentfulAsset {
          contentful_id
          gatsbyImage(layout: FULL_WIDTH, placeholder: BLURRED, width: 1280)
          resize(height: 630, width: 1200) {
            src
          }
        }
        # ... on ContentfulBlogPost {
        #   title
        #   slug
        # }
      }
    }
    ... on RepeaterPropertyMedia {
      media {
        gatsbyImage(layout: FULL_WIDTH, placeholder: BLURRED, width: 1280)
        resize(height: 630, width: 1200) {
          src
        }
      }
    }
  }
  query BlogPostBySlug(
    $slug: String!
    $previousPostSlug: String
    $nextPostSlug: String
  ) {
    contentfulBlogPost(slug: { eq: $slug }) {
      slug
      title
      author {
        name
      }
      publishDate(formatString: "MMMM Do, YYYY")
      rawDate: publishDate
      heroImage {
        gatsbyImage(layout: FULL_WIDTH, placeholder: BLURRED, width: 1280)
        resize(height: 630, width: 1200) {
          src
        }
      }
      modules {
        __typename
        ... on ContentfulRepeater {
          title
          entries {
            key
            value
          }
        }
        ... on ContentfulRepeaterV2 {
          title

          testing {
            entryProperties {
              ...Repeater
            }
          }
          testingMedia {
            entryProperties {
              ...Repeater
            }
          }
          richText {
            entryProperties {
              ...Repeater
            }
          }
        }
        ... on ContentfulTextBlock {
          title
          body {
            raw
            references {
              __typename
              ... on ContentfulAsset {
                contentful_id
                gatsbyImage(
                  layout: FULL_WIDTH
                  placeholder: BLURRED
                  width: 1280
                )
                resize(height: 630, width: 1200) {
                  src
                }
              }
              # ... on ContentfulBlogPost {
              #   title
              #   slug
              # }
            }
          }
        }
        ... on ContentfulImageBlock {
          title
          image {
            gatsbyImage(layout: FULL_WIDTH, placeholder: BLURRED, width: 1280)
            resize(height: 630, width: 1200) {
              src
            }
          }
        }
      }
      tags
      description {
        raw
      }
    }
    previous: contentfulBlogPost(slug: { eq: $previousPostSlug }) {
      slug
      title
    }
    next: contentfulBlogPost(slug: { eq: $nextPostSlug }) {
      slug
      title
    }
  }
`
