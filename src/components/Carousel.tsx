import React from 'react'
import { GatsbyImage, getImage } from 'gatsby-plugin-image'
import { renderRichText } from 'gatsby-source-contentful/rich-text'
import { BLOCKS } from '@contentful/rich-text-types'
import { z } from 'zod'

type TProps = Queries.CarouselFragment

const options = {
  renderNode: {
    [BLOCKS.EMBEDDED_ASSET]: (node) => {
      const { gatsbyImage, description } = node.data.target
      return <GatsbyImage image={getImage(gatsbyImage)!} alt={description} />
    },
  },
}

const Carousel: React.FC<TProps> = ({ title, items }) => {
  if (!items) return null

  const data = items.flatMap((e) =>
    e
      ? [
          e.entryProperties.reduce((acc, property) => {
            if (!property) return acc

            switch (property.__typename) {
              case 'RepeaterPropertyText':
                acc[property.name] = property.text
                break
              case 'RepeaterPropertyRichText':
                acc[property.name] = {
                  raw: property.richTextRaw,
                  references: property.richTextReferences,
                }
                break
              case 'RepeaterPropertyMedia':
                acc[property.name] = property.media
                break
              case 'RepeaterPropertyBoolean':
                acc[property.name] = !!property.boolean
                break
            }
            return acc
          }, {}),
        ]
      : []
  )

  const CarouselSchema = z.array(
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

  const carouselItems = CarouselSchema.parse(data)

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
