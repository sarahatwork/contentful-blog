import { PageProps, graphql } from 'gatsby'
import React from 'react'
import Layout from '../components/layout'
// @ts-ignore
import * as styles from './person.module.css'
import SocialMedia from '../components/SocialMedia'

class PersonTemplate extends React.Component<
  PageProps<Queries.PersonBySlugQuery>
> {
  render() {
    const person = this.props.data.contentfulPerson
    if (!person) return null
    return (
      <Layout location={this.props.location}>
        <div className={styles.container}>
          <div className={styles.article}>
            <h1>{person.name}</h1>
            {person.socialMedia && <SocialMedia items={person.socialMedia} />}
          </div>
        </div>
      </Layout>
    )
  }
}

export default PersonTemplate

export const pageQuery = graphql`
  query PersonBySlug($slug: String!) {
    contentfulPerson(slug: { eq: $slug }) {
      slug
      name
      socialMedia {
        blockFields {
          ...Repeater
        }
      }
    }
  }
`
