import React from 'react'
import { GatsbyImage, IGatsbyImageData, getImage } from 'gatsby-plugin-image'
import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { BLOCKS } from '@contentful/rich-text-types'
import { z } from 'zod'
import useRepeater from './useRepeater'
import { Link } from 'gatsby'

type TProps = Queries.CarouselFragment

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { gatsbyImage, description } = node.data.target
      return <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
    },
  },
}

const GATSBY_IMAGE_SCHEMA = z.record(z.any())

const SCHEMA = z.array(
  z.object({
    photoCredit: z
      .object({
        __typename: z.literal('ContentfulPerson'),
        contentful_id: z.string(),
        name: z.string(),
        slug: z.string(),
      })
      .optional(),
    caption: z.object({
      raw: z.string(),
      references: z.array(
        z.object({
          __typename: z.literal('ContentfulAsset'),
          contentful_id: z.string(),
          gatsbyImage: GATSBY_IMAGE_SCHEMA,
        })
      ),
    }),
    image: GATSBY_IMAGE_SCHEMA,
    altImages: z.array(GATSBY_IMAGE_SCHEMA).optional(),
    featured: z.boolean().optional(),
  })
)

const Carousel: React.FC<TProps> = ({ title, items }) => {
  const carouselItems = useRepeater({ items, schema: SCHEMA })
  if (!carouselItems) return null

  return (
    <>
      <h2>{title}</h2>
      {carouselItems.map((entry, i) => {
        return (
          <div
            key={i}
            style={{
              border: entry.featured ? '2px dotted #eee' : undefined,
              padding: 40,
            }}
          >
            <GatsbyImage
              alt={'Missing alt'}
              image={entry.image as IGatsbyImageData}
            />
            {entry.altImages && entry.altImages.length > 0 && (
              <div style={{ display: 'flex' }}>
                {entry.altImages.map((altImage, i) => (
                  <GatsbyImage
                    key={i}
                    style={{ width: 100, height: 100 }}
                    alt={'Missing alt'}
                    image={altImage as IGatsbyImageData}
                  />
                ))}
              </div>
            )}
            {renderRichText(entry.caption, options)}
            {entry.photoCredit && (
              <div>
                Photo courtesy of:{' '}
                <Link to={`/person/${entry.photoCredit.slug}`}>
                  {entry.photoCredit.name}
                </Link>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}
export default Carousel
