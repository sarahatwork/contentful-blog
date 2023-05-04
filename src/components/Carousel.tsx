import React from 'react'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { BLOCKS } from '@contentful/rich-text-types'
import { z } from 'zod'
import useRepeater from './useRepeater'

type TProps = Queries.CarouselFragment

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { gatsbyImage, description } = node.data.target
      return <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
    },
  },
}

const SCHEMA = z.array(
  z.object({
    photoCredit: z.string().optional(),
    caption: z.object({
      raw: z.string(),
      references: z.array(
        z.object({
          __typename: z.string(),
          contentful_id: z.string(),
        })
      ),
    }),
    image: z.object({
      gatsbyImage: z.any(),
    }),
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
            <GatsbyImage alt={'Missing alt'} image={entry.image.gatsbyImage!} />
            <p>{renderRichText(entry.caption, options)}</p>
            {entry.photoCredit && <p>Photo courtesy of: {entry.photoCredit}</p>}
          </div>
        )
      })}
    </>
  )
}
export default Carousel
