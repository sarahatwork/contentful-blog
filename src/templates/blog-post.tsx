import React from 'react'
import { Link, PageProps, graphql } from 'gatsby'
import get from 'lodash/get'
import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer'
import { BLOCKS } from '@contentful/rich-text-types'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import readingTime from 'reading-time'

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
    // const plainTextBody = documentToPlainTextString(JSON.parse(post.body.raw!))
    // const { minutes: timeToRead } = readingTime(plainTextBody)

    const options = {
      renderNode: {
        [BLOCKS.EMBEDDED_ASSET]: (node) => {
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
                      <>
                        <h2>{m.title}</h2>
                        {/* @ts-ignore */}
                        {m.body?.raw ? renderRichText(m.body, options) : null}
                      </>
                    )
                  case 'ContentfulImageBlock':
                    return (
                      <>
                        <h2>{m.title}</h2>
                        {m.image?.gatsbyImage && (
                          <GatsbyImage
                            className={styles.image}
                            alt={m.title!}
                            image={m.image?.gatsbyImage}
                          />
                        )}
                      </>
                    )
                  case 'ContentfulRepeater':
                    return (
                      <>
                        <h2>{m.title}</h2>
                        {m.entries?.map((e, i) => (
                          <div key={i}>
                            <strong>{e?.key}:</strong> {e?.value}
                          </div>
                        ))}
                      </>
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
        ... on ContentfulTextBlock {
          title
          body {
            raw
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
